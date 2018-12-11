// Tests the SpawnExpression compiler against several possible use cases.
spawn("test"); // callExpression
spawn("test"); // callExpression
thing.spawn("test"); // callExpression (memberExpression)
spawn.thing("test"); // callExpression (memberExpression)
var spawn = 123; // declaration identifier assignment
var spawn; // declaration identifier
spawn = 123; // identifier assignment
spawn thing; // keyword identifier
spawn thing(); // keyword callExpression
spawn thing("test"); // keyword callExpression
spawn obj.thing(); // keyword callExpression (memberExpression)
spawn obj.thing("test"); // keyword callExpression (memberExpression)