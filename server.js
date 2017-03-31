"use strict";

var pg = require('pg');

const spawn = require('child_process').spawn;

var infoConnect = {
  host: 'localhost',
  username: 'postgres',
  password: 123456,
  database: 'work'
}

var connect = 'postgress://' + infoConnect.username + ':' + infoConnect.password
  + '@' + infoConnect.host + '/' + infoConnect.database;

var client = new pg.Client(connect);

client.connect(function (err) {
	if(err){
		throw err;
	}

	client.on('notification', function(msg) {
		var job = JSON.parse(msg.payload);

		client.query('SELECT * FROM jobs WHERE name=\'' + job.name + '\' AND user_id=' +
     job.user_id + ' AND status=\'running\'',

			function (err, res) {
				if(err){
					throw err;
				}

				var error = '';

				if(res.rowCount == 0){
					setTimeout(function () {
						const dedworker = spawn('test.bat', []);

						client.query('UPDATE jobs SET start_time=' + (new Date().getTime() / 1000) 
              + ', status=\'running\' WHERE id=' + job.id);

						dedworker.stdin.on('data', (data) => {
							console.log(data.toString(), 2);
						});

						dedworker.on('error', (data) => {
							error = data;

							client.query('UPDATE jobs SET end_time=' + (new Date().getTime() / 1000)
                + ', status=\'ERROR\', error_message=\'' + error + '\' WHERE id=' + job.id);

							return;
						});

						dedworker.on('exit', (code) => {							
							if(code > 0){
								error = codeError(code);

								client.query('UPDATE jobs SET end_time=' + (new Date().getTime() / 1000)
                  + ', status=\'ERROR\'' + error + '\' WHERE id=' + job.id);

								return;
							}

							client.query('UPDATE jobs SET end_time=' + (new Date().getTime() / 1000)
                + ', status=\'COMPLETE\'');

							return;
						});
					}, job.schedule_time);

					return;
				}

				return;
	});


	});
	var query = client.query("LISTEN newjob");

	console.log('Connect to PostgreSQL');
});

//console.log(time.toISOString().replace(/T/, ' ').replace(/\..+/, '')); Timestamp

var codeError = (code) => {

	var errors = {
		err1: 'Uncaught Fatal Exception - There was an uncaught exception, and it was not handled by a domain or an uncaughtException event handler.',
		err2: 'Unused (reserved by Bash for builtin misuse)',
		err3: 'Internal JavaScript Parse Error - The JavaScript source code internal in Node\'s bootstrapping process caused a parse error.',
		err4: 'Internal JavaScript Evaluation Failure - The JavaScript source code internal in Node\'s bootstrapping process failed to return a function value when evaluated.',
		err5: 'Fatal Error - There was a fatal unrecoverable error in V8',
		err6: 'Non-function Internal Exception Handler - There was an uncaught exception, but the internal fatal exception handler function was somehow set to a non-function, and could not be called.',
		err7:'Internal Exception Handler Run-Time Failure - There was an uncaught exception, and the internal fatal exception handler function itself threw an error while attempting to handle it.',
		err8: 'Unused',
		err9: 'Invalid Argument',
		err10: 'Internal JavaScript Run-Time Failure - The JavaScript source code internal in Node\'s bootstrapping process threw an error when the bootstrapping function was called.',
		err12:'Invalid Debug Argument',
	};

	switch (code) {

		case 1:
			return errors.err1;
		break;

		case 2:
			return errors.err2;
		break;

		case 3:
			return errors.err3;
		break;

		case 4:
			return errors.err4;
		break;

		case 5:
			return errors.err5;
		break;

		case 6:
			return errors.err6;
		break;

		case 7:
			return errors.err7;
		break;

		case 8:
			return errors.err8;
		break;

		case 9:
			return errors.err9;
		break;

		case 10:
			return errors.err10;
		break;

		case 12:
			return errors.err12;
		break;
	}
}