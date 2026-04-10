const https = require('https');
const querystring = require('querystring');

const postForm = ({ url, auth, form }) => {
  return new Promise((resolve, reject) => {
    const payload = querystring.stringify(form);
    const req = https.request(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(auth).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(payload)
      }
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        const ok = res.statusCode >= 200 && res.statusCode < 300;
        if (!ok) {
          return reject(new Error(`Twilio request failed (${res.statusCode}): ${data.slice(0, 500)}`));
        }
        return resolve({ status: res.statusCode, body: data });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
};

const sendTwilioMessage = async ({ accountSid, authToken, to, from, body }) => {
  if (!accountSid || !authToken) throw new Error('Twilio credentials not configured');
  if (!to || !from) throw new Error('To/From is required');

  const url = new URL(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`);
  const auth = `${accountSid}:${authToken}`;

  return postForm({
    url,
    auth,
    form: {
      To: to,
      From: from,
      Body: body
    }
  });
};

module.exports = { sendTwilioMessage };

