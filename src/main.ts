import "reflect-metadata"
import * as express from 'express';
import {plainToClassFromExist, plainToInstance} from "class-transformer";
import { v4 as uuid } from "uuid";
import {NextFunction, Request, Response} from "express";

const userName = 'admin';
const userPassword = 'passw0rd';

const app = express();

app.use(express.json())

class Todo {
    id: string;
    title: string;
    description?: string;
}

const todoStorage = new Map<string, Todo>();

const sessionStorage = new Set<string>();

const todosRouter = express.Router();

todosRouter.post('/', (req, res) => {
    const todo = plainToInstance(Todo, req.body);
    todo.id = uuid();
    todoStorage.set(todo.id, todo);

    res.json(todo);
});

todosRouter.get('/', (req, res) => {
    const todos = [...todoStorage.values()];

    res.json(todos);
});

todosRouter.get('/:todoId', (req, res, next) => {
    const todoId = req.params.todoId;
    if (!todoStorage.has(todoId)) {
        return next(new NotFoundError());
    }
    const todo = todoStorage.get(todoId);

    res.json(todo);
});

todosRouter.delete('/:todoId', (req, res, next) => {
    const todoId = req.params.todoId;
    if (!todoStorage.has(todoId)) {
        return next(new NotFoundError());
    }
    todoStorage.delete(todoId);

    res.sendStatus(204);
});

todosRouter.put('/:todoId', (req, res, next) => {
    const todoId = req.params.todoId;
    if (!todoStorage.has(todoId)) {
        return next(new NotFoundError());
    }
    const previous = todoStorage.get(todoId)
    const todo = plainToClassFromExist(previous, req.body);
    todoStorage.set(todoId, todo);

    res.sendStatus(204);
})

app.use('/api/todos', authenticationMiddleware, todosRouter);

app.post('/api/login', (req, res) => {
    if (!('username' in req.body && 'password' in req.body)) {
       throw new UnauthenticatedError();
    }
    if (req.body.username !== userName || req.body.password != userPassword) {
        throw new UnauthenticatedError();
    }
    const sessionToken = uuid();

    sessionStorage.add(sessionToken);

    res.json(sessionToken)
});

app.listen(8080, () => console.log('Listening on 8080'));

function authenticationMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.headers.authorization) {
        throw new UnauthenticatedError();
    }
    if (!req.headers.authorization.startsWith('Bearer')) {
        throw new UnauthenticatedError();
    }
    const token = req.headers.authorization.substring('Bearer'.length).trim();
    if (!sessionStorage.has(token)) {
        throw new UnauthenticatedError();
    }

    next();
}

class NotFoundError extends Error {
    statusCode = 404;

    constructor() {
        super('Not found');
    }
}

class UnauthenticatedError extends Error {
    statusCode = 401;

    constructor() {
        super('Unauthenticated');
    }
}
