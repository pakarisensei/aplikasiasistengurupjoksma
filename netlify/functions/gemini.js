// Mengimpor 'fetch' jika belum tersedia secara global (best practice untuk Netlify Functions)
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

exports.handler = async (event) => {
  // 1. Memeriksa apakah metode request adalah POST. Jika tidak, tolak.
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405, // Method Not Allowed
      body: JSON.stringify({ error: 'Hanya metode POST yang diizinkan' }),
    };
  }

  try {
    // 2. Mengambil API Key dari environment variables di Netlify.
    //    Ini adalah cara yang aman untuk menyimpan kunci rahasia.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tidak ditemukan di environment variables.");
    }

    // 3. Mengurai (parse) body dari request yang dikirim oleh frontend (index.html).
    //    Kita mengharapkan sebuah objek JSON dengan properti 'prompt'.
    const { prompt } = JSON.parse(event.body);
    if (!prompt) {
      return {
        statusCode: 400, // Bad Request
        body: JSON.stringify({ error: 'Request body harus berisi "prompt".' }),
      };
    }

    // 4. Mempersiapkan payload untuk dikirim ke Google Gemini API.
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    };

    // 5. Melakukan panggilan (fetch) ke Google Gemini API.
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    // 6. Memeriksa apakah panggilan API berhasil.
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error dari Gemini API:', errorData);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Error dari Gemini API: ${errorData.error?.message || response.statusText}` }),
      };
    }

    // 7. Mengambil data JSON dari respons API.
    const result = await response.json();

    // 8. Mengekstrak teks yang dihasilkan dari respons.
    const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // 9. Mengirimkan kembali teks yang berhasil dibuat ke frontend (index.html).
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: generatedText }),
    };

  } catch (error) {
    // 10. Menangani segala jenis error yang mungkin terjadi (misal: JSON tidak valid, network error).
    console.error('Internal Server Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};