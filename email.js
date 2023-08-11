import { createTransport } from 'nodemailer';

const transporter = createTransport({
	host: "smtp-relay.sendinblue.com",
	port: 587,
	auth: {
		user: "kotelevskijdanil0@gmail.com",
		pass: "g8SZcyPzY51RTI0x",
	},
});

export async function sendPasswordOnEmail(toEmail, userPassword) {
	try {
		await transporter.sendMail({
			from: "kotelevskijdanil0@gmail.com",
			to: toEmail,
			subject: "Password reminder",
			html:
				`
			<h2>Hi, from TaskManager.cx.ua</h2>
			<p>You've received this message because we got your "Forgot password" request.</p>
			<p>To log into account use: <strong>${userPassword}</strong>.</p>
			<br>
			<p>Got any questions? Please, ask them to the <a href="mailto:kotelevskijdanil0@gmail.com">kotelevskijdanil0@gmail.com</a></p>
			<br>
			<p>Best regards.</p>
			`,

		});
	} catch (err) {
		console.log('Error message: ' + err);
	}
}