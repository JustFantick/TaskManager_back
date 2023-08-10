import express from 'express';
import mysql from 'mysql2';

const app = express();
const PORT = process.env.PORT || 3000;

var connection = mysql.createPool({
	host: 'localhost',
	user: 'root',
	password: '0000',
	database: 'todo_task_manager',
	waitForConnections: true,
	connectionLimit: 10,
	queueLimit: 0
});

app.use(express.static('public'));

//Authorize
app.get(
	'/authorizeTry',
	async (req, res) => {
		const enteredLogin = req.query.login;
		const enteredPassword = req.query.password;

		try {
			const promise = connection.promise();
			const result = await promise.execute(
				`SELECT user_id, login, password FROM users WHERE users.login = '${enteredLogin}';`
			);

			if (result[0].length === 0) {
				res.send({ status: 0, errorType: "user not found" });
			} else if (result[0][0].password !== enteredPassword) {
				res.send({ status: 0, errorType: "invalid password" });
			} else {
				res.send({ status: 1, userId: result[0][0].user_id, userLogin: result[0][0].login });
			}
		} catch (err) {
			res.send({ status: 0, errorType: err });
			console.log('Error! \n' + err);
		}
	}
);

//GetTasks
app.get(
	'/getTasks',
	async (req, res) => {
		const enteredUserId = req.query.userId;

		try {
			const promise = connection.promise();

			const tasks = await promise.execute(
				`SELECT task_id, title, status, isImportant, note, lastEdit FROM tasks WHERE tasks.user_id = ${enteredUserId};`
			);

			async function getResTasks(initTasksArray) {
				for (let i = 0; i < initTasksArray.length; i++) {
					const stepsForTask = await promise.execute(
						`SELECT title, status  FROM steps WHERE steps.task_id = ${initTasksArray[i].task_id};`
					);
					initTasksArray[i].steps = await stepsForTask[0];
				}
				return initTasksArray;
			}

			res.send(await getResTasks(tasks[0]));

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

//registerNewUser
app.post(
	'/registerNewUser',
	async (req, res) => {
		const enteredLogin = req.query.login;
		const enteredPassword = req.query.password;

		try {
			const promise = connection.promise();

			const result = await promise.execute(
				`SELECT login FROM users WHERE users.login = '${enteredLogin}'`
			);

			if (result[0].length !== 0) {
				res.send({ status: 0, errorType: "user already exist" });
			} else {
				await promise.execute(
					`INSERT INTO users (login, password) VALUES ('${enteredLogin}', '${enteredPassword}');`
				);
				const createdUsersId = await promise.execute(
					`SELECT user_id, login FROM users WHERE users.login = '${enteredLogin}'`
				);
				res.send({ status: 1, userId: createdUsersId[0][0].user_id, userLogin: enteredLogin });
			}
		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

/////////////////////
//Editing tasks&steps
app.patch(
	'/setTaskTitle',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const newTaskTitle = req.query.newTaskTitle;
			const oldTaskTitle = req.query.oldTaskTitle;

			await promise.execute(
				`UPDATE tasks SET tasks.title = '${newTaskTitle}' 
					WHERE tasks.user_id = ${userId} AND tasks.title = '${oldTaskTitle}';`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.delete(
	'/deleteTask',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;

			const taskIdQuery = await promise.execute(
				`SELECT tasks.task_id FROM tasks WHERE tasks.title= '${taskTitle}' AND tasks.user_id = ${userId};`
			);
			const taskId = await taskIdQuery[0][0].task_id;

			const isSteps = await promise.execute(
				`SELECT * FROM steps WHERE steps.task_id = ${taskId};`
			);

			if (isSteps[0].length !== 0) {
				await promise.execute(`DELETE FROM steps WHERE steps.task_id = ${taskId};`);
			}

			await promise.execute(
				`DELETE FROM tasks WHERE tasks.title = '${taskTitle}' AND tasks.user_id = ${userId};`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.post(
	'/addTask',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const editTime = req.query.editTime;

			await promise.execute(
				`INSERT INTO tasks (user_id, title, status, isImportant, lastEdit)
					VALUES (${userId}, '${taskTitle}', 0, 0, '${editTime}');`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.patch(
	'/setTaskStatus',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const newStatus = req.query.newStatus;

			await promise.execute(
				`UPDATE tasks SET tasks.status = ${newStatus}
					WHERE tasks.user_id = ${userId} AND tasks.title = '${taskTitle}';`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.patch(
	'/setTaskIsImportant',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const newIsImportant = req.query.isImportant;

			await promise.execute(
				`UPDATE tasks SET tasks.isImportant = ${newIsImportant}
					WHERE tasks.user_id = ${userId} AND tasks.title = '${taskTitle}';`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.patch(
	'/setTaskNote',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const note = req.query.note;

			await promise.execute(
				`UPDATE tasks SET tasks.note = '${note}'
					WHERE tasks.user_id = ${userId} AND tasks.title = '${taskTitle}';`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.patch(
	'/setLastEdit',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const lastEdit = req.query.lastEdit;

			await promise.execute(
				`UPDATE tasks SET tasks.lastEdit = '${lastEdit}'
					WHERE tasks.user_id = ${userId} AND tasks.title = '${taskTitle}';`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

//Steps
app.post(
	'/addStep',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const stepTitle = req.query.stepTitle;

			const taskIdQuery = await promise.execute(
				`SELECT tasks.task_id FROM tasks WHERE tasks.title= '${taskTitle}' AND tasks.user_id = ${userId};`
			);
			const taskId = await taskIdQuery[0][0].task_id;

			await promise.execute(
				`INSERT INTO steps (task_id, status, title) VALUES (${taskId}, 0, '${stepTitle}');`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.delete(
	'/deleteStep',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const stepTitle = req.query.stepTitle;

			const taskIdQuery = await promise.execute(
				`SELECT tasks.task_id FROM tasks WHERE tasks.title= '${taskTitle}' AND tasks.user_id = ${userId};`
			);
			const taskId = await taskIdQuery[0][0].task_id;

			await promise.execute(
				`DELETE FROM steps WHERE
						steps.task_id = ${taskId} AND steps.title = '${stepTitle}';`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.patch(
	'/setStepStatus',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const stepTitle = req.query.stepTitle;
			const stepStatus = req.query.stepStatus;

			const taskIdQuery = await promise.execute(
				`SELECT tasks.task_id FROM tasks WHERE tasks.title= '${taskTitle}' AND tasks.user_id = ${userId};`
			);
			const taskId = await taskIdQuery[0][0].task_id;

			await promise.execute(
				`UPDATE steps SET steps.status = '${stepStatus}'
					WHERE steps.task_id = ${taskId} AND steps.title = '${stepTitle}';`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.patch(
	'/setStepTitle',
	async (req, res) => {
		try {
			const promise = connection.promise();

			const userId = req.query.userId;
			const taskTitle = req.query.taskTitle;
			const oldStepTitle = req.query.oldStepTitle;
			const newStepTitle = req.query.newStepTitle;

			const taskIdQuery = await promise.execute(
				`SELECT tasks.task_id FROM tasks WHERE tasks.title= '${taskTitle}' AND tasks.user_id = ${userId};`
			);
			const taskId = await taskIdQuery[0][0].task_id;

			await promise.execute(
				`UPDATE steps SET steps.title = '${newStepTitle}'
					WHERE steps.task_id = ${taskId} AND steps.title = '${oldStepTitle}';`
			);

		} catch (err) {
			console.log('Error! \n' + err);
		}
	}
);

app.listen(PORT, () => console.log('Server running on port: ' + PORT));