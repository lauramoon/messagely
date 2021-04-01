const request = require("supertest");

const app = require("../app");
const db = require("../db");
const User = require("../models/user");
const Message = require("../models/message");

describe("Message Routes Test", function () {
  beforeEach(async function () {
    await db.query("DELETE FROM messages");
    await db.query("DELETE FROM users");
    await db.query("ALTER SEQUENCE messages_id_seq RESTART WITH 1");

    let u1 = await User.register({
      username: "test1",
      password: "password",
      first_name: "Test1",
      last_name: "Testy1",
      phone: "+14155550000",
    });
    let u2 = await User.register({
      username: "test2",
      password: "password",
      first_name: "Test2",
      last_name: "Testy2",
      phone: "+14155552222",
    });
    let u3 = await User.register({
      username: "test3",
      password: "password",
      first_name: "Test3",
      last_name: "Testy3",
      phone: "+14155554444",
    });
    let m1 = await Message.create({
      from_username: "test1",
      to_username: "test2",
      body: "u1-to-u2",
    });
    let m2 = await Message.create({
      from_username: "test2",
      to_username: "test1",
      body: "u2-to-u1",
    });
  });

  describe("GET /:id", function () {
    test("get message details when sender logged in", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/messages/1").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message: {
          id: 1,
          body: "u1-to-u2",
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
          },
          to_user: {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155552222",
          },
        },
      });
    });

    test("get message details when recipient logged in", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test2", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/messages/1").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message: {
          id: 1,
          body: "u1-to-u2",
          sent_at: expect.any(String),
          read_at: null,
          from_user: {
            username: "test1",
            first_name: "Test1",
            last_name: "Testy1",
            phone: "+14155550000",
          },
          to_user: {
            username: "test2",
            first_name: "Test2",
            last_name: "Testy2",
            phone: "+14155552222",
          },
        },
      });
    });

    test("get 401 when logged-in user not sender or recipient", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test3", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).get("/messages/1").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(401);
    });

    test("get 401 when no user logged in", async function () {
      let response = await request(app).get("/messages/1");
      expect(response.statusCode).toEqual(401);
    });
  });

  /** POST / - post message. */

  describe("POST /", function () {
    test("logged-in user can post message to other user", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test3", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).post("/messages/").send({
        _token: token,
        to_username: "test2",
        body: "u3-to-u2",
      });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message: {
          id: 3,
          from_username: "test3",
          to_username: "test2",
          body: "u3-to-u2",
          sent_at: expect.any(String),
        },
      });
    });

    test("get 400 if post request has no to_username", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test3", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).post("/messages/").send({
        _token: token,
        body: "u3-to-u2",
      });
      expect(response.statusCode).toEqual(400);
    });

    test("get 400 if post request has no body", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test3", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).post("/messages/").send({
        _token: token,
        to_username: "test1",
      });
      expect(response.statusCode).toEqual(400);
    });

    test("get 400 if to_username does not exist", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test3", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).post("/messages/").send({
        _token: token,
        to_username: "test4",
        body: "u3-to-u4",
      });
      expect(response.statusCode).toEqual(400);
    });

    test("get 401 when no user logged in", async function () {
      let response = await request(app).post("/messages/").send({
        to_username: "test2",
        body: "u3-to-u2",
      });
      expect(response.statusCode).toEqual(401);
    });
  });

  /** POST/:id/read - mark message as read:
   *
   *  => {message: {id, read_at}}
   *
   * Make sure that the only the intended recipient can mark as read.
   *
   **/

  describe("POST /:id/read", function () {
    test("recipient can mark message as read", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test2", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).post("/messages/1/read").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual({
        message: { id: 1, read_at: expect.any(String) },
      });
    });

    test("get 401 if user other than recipient attempts to mark as read", async function () {
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ username: "test1", password: "password" });
      const token = loginResponse.body.token;

      let response = await request(app).post("/messages/1/read").send({
        _token: token,
      });
      expect(response.statusCode).toEqual(401);
    });

    test("get 401 when no user logged in", async function () {
      let response = await request(app).post("/messages/1/read").send({
        to_username: "test2",
        body: "u3-to-u2",
      });
      expect(response.statusCode).toEqual(401);
    });
  });
});

afterAll(async function () {
  await db.end();
});
