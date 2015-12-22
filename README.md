To access pgasus-backed web service, create a new `WebService` object.

`var ws = new WebService(baseUrl, [username], [password]);`

`username` and `password` are optional parameters if HTTP basic authentication is needed.

`WebService` objects have two methods:
* `relation(path)` when the resource is a relation (table or view).
* `procedure(path)` when the resource is a procedure (function).

Objects returned by `relation` have four methods:
* `get(parameters, filter, order, limit, callback)`
* `post(parameters, callback)`
* `put(parameters, filter, callback)`
* `del(parameters, filter, callback)`, for `delete` HTTP method (delete is a reserved keyword in ECMAScript)

Objects returned by `procedure` have four methods:
* `get(parameters, callback)`
* `post(parameters, callback)`
* `put(parameters, callback)`
* `del(parameters, callback)`, for `delete` HTTP method (delete is a reserved keyword in ECMAScript)

The provided `callback` must have type `function(error, result)` or be left unspecified. Arguments are:
* `error`, null if no error detected, otherwise an object with the following members:
** `httpStatus`, the numeric HTTP status code.
** `httpStatusText`, the HTTP status message.
** `description`, additional description of the error may be included here.
* `result`, if no error has been detected, this will be the deserialized JSON value returned by the remote server.

#### Example

```
var ws = new WebService("https://test.com");
var login = ws.procedure("/users/:user_id/login").post;
login({"user_id": "bob", "password": "$3cur3"}, function(res) {
  var projectTasks = ws.relation("/projects/:project_id/tasks");
  projectTasks.get({"project_id": 100}, null, QM.Order("dueDate"), null, function(res) { });
});
```
