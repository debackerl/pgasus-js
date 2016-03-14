// Copyright (c) 2015, Laurent Debacker
// MIT License

function WebService(baseUrl, username, password) {
	this.baseUrl = baseUrl;
	this.username = username;
	this.password = password;
	this.filter = "f";
	this.sort = "s";
	this.limit = "l";
	
	var ws = this;
	var xhr = XMLHttpRequest || require("xmlhttprequest").XMLHttpRequest;
	
	function load_resource(method, path, parameters, querystring, callback) {
		var req = new xhr();
		if(callback)
			req.onreadystatechange = function() {
				if(req.readyState == 4) {
					if(req.status == 200) {
						callback(null, JSON.parse(req.responseText));
					} else {
						callback({"httpStatus": req.status, "httpStatusText": req.statusText, "description": req.responseText});
					}
				}
			};
		
		var done = {}, url = ws.baseUrl + path.replace(/\/[:*]([\w_]+)/g, function(_, id) {
			done[id] = true;
			var v = parameters[id];
			return "/" + (v ? encodeURIComponent(v) : "");
		}) + ".json";
		
		var qs = querystring(done);
		if(qs.length) url += "?" + qs.join("&");
		
		req.open(method, url, true, ws.user, ws.password);
		
		switch(method) {
		case "POST":
		case "PUT":
			var body = {};
			for(var id in parameters)
				if(Object.prototype.hasOwnProperty.call(parameters, id) && !done[id])
					body[id] = parameters[id];
			
			req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
			req.send(JSON.stringify(body));
			break;
		default:
			req.send();
			break;
		}
	}
	
	function omap(f) {
		var res = {}, o = {"get":"GET","put":"PUT","post":"POST","del":"DELETE"};
		for(var id in o) res[id] = f(o[id]);
		return res;
	}
	
	return {
		"relation": function(path) {
			var res = omap(function(method) {
				return function(parameters, filter, callback) {
					load_resource(method, path, parameters, function() {
						var qs = [];
						if(filter) qs.push(ws.filter + "=" + filter);
						return qs;
					}, callback);
				};
			});
			res.get = function(parameters, filter, sort, limit, callback) {
				load_resource("GET", path, parameters, function() {
					var qs = [];
					if(filter) qs.push(ws.filter + "=" + filter);
					if(sort) qs.push(ws.sort + "=" + sort);
					if(typeof(limit) === "number") qs.push(ws.limit + "=" + limit);
					return qs;
				}, callback);
			};
			res.post = function(parameters, callback) {
				load_resource("POST", path, parameters, function() {
					return [];
				}, callback);
			};
			return res;
		},
		"procedure": function(path) {
			return omap(function(method) {
				return function(parameters, callback) {
					load_resource(method, path, parameters, function(done) {
						var qs = [];
						switch(method) {
						case "GET":
						case "DELETE":
							for(var id in parameters)
								if(Object.prototype.hasOwnProperty.call(parameters, id) && !done[id])
									qs.push(id + "=" + encodeURIComponent(JSON.stringify(parameters[id])));
							break;
						}
						return qs;
					}, callback);
				};
			});
		}
	};
}
