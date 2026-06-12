const CANNY_API_KEY = 'dbaba358-a925-2c7b-1f48-0abb577688dd';
const CANNY_BOARD_ID = '6a1b2105dad3883c255b666c';

async function main() {
  const payload = {
    apiKey: CANNY_API_KEY,
    boardID: CANNY_BOARD_ID,
    title: 'Privacidade: CPF ocultado para não-gestores',
    details: 'Implementada restrição no sistema de alunos. O CPF de estudantes agora é visível apenas para usuários com cargos GESTOR, COORD ou admin_global. Para outros cargos, o valor é exibido como ***.***.***-** com ícone de privacidade e tooltip explicativo.',
    authorID: '6a1b1c9c86d7b8843b6d467f' // Fallback admin changer
  };

  try {
    const res = await fetch('https://canny.io/api/v1/posts/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(`Canny API Error: ${JSON.stringify(data)}`);
    }

    console.log('Post criado com sucesso no Canny!', data);
  } catch (error) {
    console.error('Erro ao criar post no Canny:', error);
  }
}

main();
