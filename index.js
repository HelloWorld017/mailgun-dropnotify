const axios = require('axios');
const config = require('./config.json');

const MAILGUN_API = 'https://api.mailgun.net/v3/';
const TELEGRAM_API = 'https://api.telegram.org/';

const escapeHtml = text => {
	const escapeSet = {'"': '&quot;', '&': '&amp;', '<': '&lt;', '>': '&gt;'};
	return text.replace(/[\"&<>]/g, c => escapeSet[c]);
};

const report = async (item, description) => {
	await axios({
		method: 'post',
		url: `https://api.telegram.org/bot${config.telegram}/sendMessage`,
		data: {
			chat_id: config.telegramTo,
			text: `<b>${escapeHtml(item)}<b>\n\n<pre>${escapeHtml(description)}</pre>`,
			parse_mode: 'HTML'
		}
	});
};


(async () => {
	for(let domain of config.mailgunDomains) {
		try {
			const {data} = await axios({
				url: `/${domain}/bounces`,
				baseURL: MAILGUN_API,
				auth: {
					username: 'api',
					password: config.mailgunKey
				}
			});
			
			if(data.items.length > 0) {
				await report(
					`[MAILGUN DROPCHECK] About ${data.items.length} emails have been dropped on ${domain}!!`,
					JSON.stringify(data, '\t')
				);
			}
		} catch(e) {
			await report("[MAILGUN DROPCHECK] Error while retrieving!", e.stack);
		}
	}
})();
