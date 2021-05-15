const { spawn, exec, spawnSync } = require("child_process");
let redebug=false;
  const waitprocess={}
	const sleepAndCheck = (cmd, ms) => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				let command_output = spawnSync(cmd, { shell: true });
				resolve(command_output);
			}, ms);
		});
	};

	waitprocess.waitRunning = (process_name, isRunning, timeout) => {
		return new Promise((resolve, reject) => {
			let platform = process.platform;
			let cmd = "";
			switch (platform) {
				case "win32":
					cmd = `tasklist`;
					break;
				case "darwin":
					cmd = `bash -c "ps -ax | grep ${process_name}"`;
					break;
				case "linux":
					cmd = `ps -A | grep ${process_name}| tr -d '\n'`;
					break;
				default:
					break;
			}

			let minimum_delay = 100;
			if (redebug)
				console.log(
					" checking on recorder is " + isRunning
						? ""
						: "not" + " running still"
				);
			// wait some time for processes to start or stop
			let timerHandle = setInterval(
				() => {
					// start one and check if its running
					sleepAndCheck(cmd, minimum_delay).then((r) => {
						//r.stdout=r.buffer.toString()
						if (redebug)
							console.log(
								"recorder process list ='" + r.stdout + "'"
							);
						// check the cmd results
						let s = r.stdout.toString().toLowerCase();
						if (isRunning == false) {
							if (!s.includes(process_name.toLowerCase())) {
								clearInterval(timerHandle);
								if (redebug)
									console.log(
										"recorder " +
											process_name +
											" is not running now"
									);
								resolve();
								return;
								if(redebug)
									console.log('not found continuing after return????')
							}
						} else {
							if (redebug)
								console.log(
									" testing for '" +
										process_name +
										"' in stdout=" +
										r.stdout.toString()
								);
							if (s.includes(process_name.toLowerCase())) {
								clearInterval(timerHandle);
								if (redebug)
									console.log(
										" recorder found '" +
											process_name +
											"' running"
									);
								resolve();
								return;
							}
						}
						timeout -= minimum_delay;
						if (redebug)
							console.log("recorder adjusting remaining minimum_delay");
						// thru whole minimum_delay, failed
						if (timeout <= 0) {
							clearInterval(timerHandle);
							if (redebug)
								console.log(
									"recorder test for '" +
										process_name +
										"' was not found "
								);

							reject("timeout");
							return;
						}
					}); // end of sleep and check then
				}, // end interval handler
				minimum_delay+5
			); // end setInterval
		}); // end promise
	};

module.exports = waitprocess;
