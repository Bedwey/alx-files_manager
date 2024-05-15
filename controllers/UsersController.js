import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      res.status(400).send({ error: 'Missing email' });
      return;
    }

    if (!password) {
      res.status(400).send({ error: 'Missing password' });
      return;
    }

    const user = await dbClient.users.findOne({ email });
    if (user) {
      res.status(400).send({ error: 'Already exist' });
      return;
    }

    const newUser = {
      email,
      password: sha1(password),
    };

    const result = await dbClient.users.insertOne(newUser);
    res.status(201).send({ id: result.insertedId, email });
  }

  static async getMe(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    res.status(200).send({ id: user._id.toString(), email: user.email });
  }
}

export default UsersController;
