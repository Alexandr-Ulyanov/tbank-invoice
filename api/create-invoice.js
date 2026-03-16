export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error 'Method Not Allowed — используй POST' });
  }

  const body = req.body;

  const required = ['name', 'inn', 'kpp', 'email'];
  for (const field of required) {
    if (!body[field]  typeof body[field] !== 'string'  body[field].trim() === '') {
      return res.status(400).json({ error `Поле ${field} обязательно и не может быть пустым` });
    }
  }

  const payload = {
    invoiceNumber Date.now().toString().slice(-10),
    dueDate new Date(Date.now() + 30  24  60  60  1000).toISOString().split('T')[0],
    payer {
      name body.name.trim(),
      inn body.inn.trim(),
      kpp body.kpp.trim()
    },
    items body.items  [
      { name 'Товар или услуга', price 10000, unit 'шт', vat '20', amount 1 }
    ],
    contacts [{
      email body.email.trim(),
      contactPhone (body.phone  '').trim()
    }],
    comment body.comment  ''
  };

  try {
    const response = await fetch('httpsbusiness.tbank.ruopenapiapiv1invoicesend', {
      method 'POST',
      headers {
        'Authorization' `Bearer ${process.env.TBANK_TOKEN}`,
        'Content-Type' 'applicationjson',
        'X-Request-Id' crypto.randomUUID  crypto.randomUUID()  `fallback-${Date.now()}`
      },
      body JSON.stringify(payload)
    });

    if (!response.ok) {
      let errData;
      try {
        errData = await response.json();
      } catch {
        errData = { message response.statusText };
      }
      return res.status(response.status).json({
        error 'Ошибка от Т-Банка',
        status response.status,
        details errData
      });
    }

    const data = await response.json();
    res.status(200).json({
      success true,
      pdfUrl data.pdfUrl,
      invoiceId data.invoiceId
    });
  } catch (err) {
    console.error('Server error', err);
    res.status(500).json({ error 'Внутренняя ошибка сервера' });
  }
}