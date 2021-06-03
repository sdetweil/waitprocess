const { spawn, exec, spawnSync } = require("child_process");
const sudo = require('sudo-js');

let redebug=false;
  const waitprocess={}
	const sleepAndCheck = (cmd, ms) => {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				if(redebug) console.log("launching checker")
				exec(cmd,{ shell: true }, (error, stdout, stderr) => {
					//let command_output = spawnSync(cmd, { shell: true });
					if(!error && !stderr)
						resolve(stdout);
					else
						if(redebug) console.log("launching failed "+ JSON.stringify(error | stderr))
				})
			}, ms);
		});
	}

	waitprocess.waitRunning = (process_name, ShouldBeRunning, timeout) => {
		return new Promise((resolve, reject) => {
			let save_timeout=timeout
			let platform = process.platform;
			let cmd = "";
			switch (platform) {
				case "win32":
					cmd = `tasklist /fi "ImageName eq ${process_name}"`;
					break;
				case "darwin":
					cmd = `bash -c "ps -ax | grep ${process_name} | grep signed | grep -v grep"`;
					break;
				case "linux":
					cmd = `ps -A | grep ${process_name}| grep -v grep |tr -d '\n'`;
					break;
				default:
					break;
			}

			let minimum_delay = 100;
			if (redebug)
				console.log(
					" checking on recorder is " + ShouldBeRunning
						? ""
						: "not" + " running still"
				);
			// wait some time for processes to start or stop
			let timerHandle = setInterval(
				() => {
					// start one and check if its running
					sleepAndCheck(cmd, minimum_delay).then((r) => {
						if (redebug)
							console.log(
								"recorder process list ='" + r + "'"
							);
						// check the cmd results
						let s = r.toString().toLowerCase();
						if (ShouldBeRunning == false) {
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
							} else {
								if(timeout<(save_timeout/2)){
									//clearInterval(timerHandle)
									if(redebug) console.log("force killing recorder ="+process_name)
									save_timeout=timeout
									sudo.killByName(process_name, (err, pid, result)=>{
										if(!err){}
									})
								}
							}
						} else {
							if (redebug)
								console.log(
									" testing for '" +
										process_name +
										"' in stdout=" +
										r.toString()
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
