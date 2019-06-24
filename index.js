const axios = require('axios');
const fs = require('fs');

const config = require('./config.json');

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
			text: `<b>${escapeHtml(item)}</b>\n\n<pre>${escapeHtml(description)}</pre>`,
			parse_mode: 'HTML'
		}
	});
};


(async () => {
	let lastRun = 0;
	
	try {
		lastRun = fs.readFileSync('./lastrun.dat', 'utf8');
	} catch(e){}
	
	for(let domain of config.mailgunDomains) {
		try {
			const {data} = await axios({
				url: `https://api.mailgun.net/v3/${domain}/bounces`,
				auth: {
					username: 'api',
					password: config.mailgunKey
				}
			});
			
			const items = data.items.filter(({created_at}) => new Date(created_at).getTime() > lastRun);
			if(items.length > 0) {
				await report(
					`[MAILGUN DROPCHECK] About ${items.length} emails have been dropped on ${domain}!!`,
					JSON.stringify(items, '\t')
				);
			}
		} catch(e) {
			await report("[MAILGUN DROPCHECK] Error while retrieving!", e.stack);
		}
	}
	
	fs.writeFileSync('./lastrun.dat', Date.now());
})();
