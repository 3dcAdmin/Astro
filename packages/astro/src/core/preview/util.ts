export function getResolvedHostForHttpServer(host: string | boolean) {
	if (host === false) {
		// Use a secure default
		return 'localhost';
	} else if (host === true) {
		// If passed --host in the CLI without arguments
		return undefined; // undefined typically means 0.0.0.0 or :: (listen on all IPs)
	} else {
		return host;
	}
}
