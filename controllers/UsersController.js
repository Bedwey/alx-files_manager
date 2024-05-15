import sha1 from 'sha1';
import dbClient from '../utils/db';

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
}

export default UsersController;
