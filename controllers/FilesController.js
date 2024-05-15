import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const token = req.headers['x-token'];
    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const {
      name, type, parentId = '0', isPublic = false, data,
    } = req.body;
    if (!name) {
      res.status(400).send({ error: 'Missing name' });
      return;
    }

    if (!type || !['folder', 'file', 'image'].includes(type)) {
      res.status(400).send({ error: 'Missing type' });
      return;
    }

    if (type !== 'folder' && !data) {
      res.status(400).send({ error: 'Missing data' });
      return;
    }

    if (parentId !== '0') {
      const parentFile = await dbClient.files.findOne({ _id: ObjectId(parentId) });
      if (!parentFile) {
        res.status(400).send({ error: 'Parent not found' });
        return;
      }

      if (parentFile.type !== 'folder') {
        res.status(400).send({ error: 'Parent is not a folder' });
        return;
      }
    }

    const fileData = {
      userId: ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: ObjectId(parentId),
    };

    if (type !== 'folder') {
      const path = process.env.FOLDER_PATH || '/tmp/files_manager';
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }

      const localPath = `${path}/${uuidv4()}`;
      fs.writeFileSync(localPath, data, 'base64');
      fileData.localPath = localPath;
    }

    const file = await dbClient.files.insertOne(fileData);
    res.status(201).send({
      id: file.insertedId, userId, name, type, isPublic, parentId,
    });
  }
}

export default FilesController;
