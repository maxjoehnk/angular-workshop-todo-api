import "reflect-metadata"
import * as express from 'express';
import {plainToClassFromExist, plainToInstance} from "class-transformer";
import { v4 as uuid } from "uuid";

const app = express();

app.use(express.json())

class Todo {
    id: string;
    title: string;
    description?: string;
}

const todoStorage = new Map<string, Todo>();

app.post('/api/todos', (req, res) => {
    const todo = plainToInstance(Todo, req.body);
    todo.id = uuid();
    todoStorage.set(todo.id, todo);

    res.json(todo);
});

app.get('/api/todos', (req, res) => {
    const todos = [...todoStorage.values()];

    res.json(todos);
});

app.get('/api/todos/:todoId', (req, res, next) => {
    const todoId = req.params.todoId;
    if (!todoStorage.has(todoId)) {
        return next(new NotFoundError());
    }
    const todo = todoStorage.get(todoId);

    res.json(todo);
});

app.delete('/api/todos/:todoId', (req, res, next) => {
    const todoId = req.params.todoId;
    if (!todoStorage.has(todoId)) {
        return next(new NotFoundError());
    }
    todoStorage.delete(todoId);

    res.sendStatus(204);
});

app.put('/api/todos/:todoId', (req, res, next) => {
    const todoId = req.params.todoId;
    if (!todoStorage.has(todoId)) {
        return next(new NotFoundError());
    }
    const previous = todoStorage.get(todoId)
    const todo = plainToClassFromExist(previous, req.body);
    todoStorage.set(todoId, todo);

    res.sendStatus(204);
})

app.listen(8080, () => console.log('Listening on 8080'));

class NotFoundError extends Error {
    statusCode = 404;

    constructor() {
        super('Not found');
    }
}
