import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const auth = req.headers.authorization;
    if (!auth) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const credentials = Buffer.from(auth.split(' ')[1], 'base64').toString('utf8').split(':');
    const email = credentials[0];
    const password = sha1(credentials[1]);

    const user = await dbClient.users.findOne({ email, password });
    if (!user) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const token = uuidv4();
    await redisClient.set(`auth_${token}`, user._id.toString(), 86400);
    res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    await redisClient.del(`auth_${token}`);
    res.status(204).send();
  }
}

export default AuthController;
