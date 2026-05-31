import { NextRequest, NextResponse } from 'next/server';

const CANNY_API_KEY = 'dbaba358-a925-2c7b-1f48-0abb577688dd';
const CANNY_BOARD_ID = '6a1b2105dad3883c255b666c';
const CANNY_AUTHOR_ID = '6a1b1c9c86d7b8843b6d467f'; // Gestor admin changer fallback

// Status mapping: Canny -> UI
const toUIStatus: Record<string, string> = {
  'open': 'Aberto',
  'planned': 'Planejado',
  'in progress': 'Em progresso',
  'complete': 'Concluido',
};

// Status mapping: UI -> Canny
const toCannyStatus: Record<string, string> = {
  'Aberto': 'open',
  'Planejado': 'planned',
  'Em progresso': 'in progress',
  'Concluido': 'complete',
};

async function cannyRequest(path: string, payload: any) {
  const res = await fetch(`https://canny.io${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      apiKey: CANNY_API_KEY,
      ...payload,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Canny API Error ${res.status}: ${errorText}`);
  }

  return res.json();
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    if (action === 'list') {
      const data = await cannyRequest('/api/v1/posts/list', {
        boardID: CANNY_BOARD_ID,
        limit: 100,
      });

      const mappedPosts = (data.posts || []).map((post: any) => {
        const votesCount = post.score || 0;
        const votersEmails = (post.voters || []).map((v: any) => v.email).filter(Boolean);
        const mappedStatus = toUIStatus[post.status] || 'Aberto';

        return {
          id: post.id,
          title: post.title,
          description: post.details || '',
          category: 'Geral', // Default category
          status: mappedStatus,
          votes: votesCount,
          votedBy: votersEmails,
          createdBy: post.author?.email || 'anonimo@escola.gov.br',
          createdByName: post.author?.name || 'Sugerente Escola',
          createdSchool: 'EECM João Batista',
          createdAt: post.created || new Date().toISOString(),
        };
      });

      return NextResponse.json(mappedPosts);
    }

    if (action === 'create') {
      const { title, description, userEmail, authorName } = body;
      if (!title || !description || !userEmail || !authorName) {
        return NextResponse.json({ error: 'Missing required parameters for creation' }, { status: 400 });
      }

      // 1. Retrieve or Create Canny User
      const user = await cannyRequest('/api/v1/users/retrieve_or_create', {
        email: userEmail,
        name: authorName,
        userID: userEmail,
      });

      // 2. Create the Post in Canny
      const newPost = await cannyRequest('/api/v1/posts/create', {
        boardID: CANNY_BOARD_ID,
        authorID: user.id,
        title,
        details: description,
      });

      return NextResponse.json({ success: true, post: newPost });
    }

    if (action === 'status') {
      const { postId, status } = body;
      if (!postId || !status) {
        return NextResponse.json({ error: 'Missing postId or status' }, { status: 400 });
      }

      const cannyStatusValue = toCannyStatus[status] || 'open';

      const updated = await cannyRequest('/api/v1/posts/change_status', {
        postID: postId,
        status: cannyStatusValue,
        changerID: CANNY_AUTHOR_ID,
        shouldNotifyVoters: false,
      });

      return NextResponse.json({ success: true, post: updated });
    }

    if (action === 'vote') {
      const { postId, userEmail, authorName, vote } = body;
      if (!postId || !userEmail || !authorName || vote === undefined) {
        return NextResponse.json({ error: 'Missing required parameters for voting' }, { status: 400 });
      }

      // 1. Retrieve or Create User to get Canny Voter ID
      const user = await cannyRequest('/api/v1/users/retrieve_or_create', {
        email: userEmail,
        name: authorName,
        userID: userEmail,
      });

      // 2. Add or Remove Vote
      const endpoint = vote ? '/api/v1/votes/create' : '/api/v1/votes/delete';
      const result = await cannyRequest(endpoint, {
        postID: postId,
        voterID: user.id,
      });

      return NextResponse.json({ success: true, result });
    }

    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch (error: any) {
    console.error('Error in /api/canny:', error);
    return NextResponse.json({ error: error.message || 'Canny operation failed' }, { status: 500 });
  }
}
