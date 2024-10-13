import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from 'src/entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findOne(id): Promise<User> {
    const foundUser = await this.userModel.findOne({ _id: id }).exec();
    if (!foundUser) {
      throw new NotFoundException('User was not found!');
    }
    return foundUser;
  }

  async findByEmail(email: string): Promise<User> {
    const foundUser: User = await this.userModel.findOne({ email: email });
    return foundUser;
  }

  async create(createUserDto: CreateUserDto) {
    const existingUserEmail = await this.userModel.findOne({
      email: createUserDto.email,
    });

    const existingUsername = await this.userModel.findOne({
      username: createUserDto.username,
    });

    if (existingUserEmail) {
      throw new ConflictException('User with provided email already exists!');
    } else if (existingUsername) {
      throw new ConflictException(
        'User with provided username already exists!',
      );
    } else {
      (await this.userModel.create(createUserDto)).save();
    }
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<User>> {
    const userToUpdate = await this.userModel.findById(id);

    if (!userToUpdate) throw new NotFoundException('User was not found!');

    const existingUserEmail = await this.userModel.findOne({
      _id: { $ne: id },
      email: updateUserDto.email,
    });

    const existingUsername = await this.userModel.findOne({
      _id: { $ne: id },
      username: updateUserDto.username,
    });

    if (existingUserEmail) {
      throw new ConflictException(
        'Cannot update to provided email! User with provided email already exists!',
      );
    } else if (existingUsername) {
      throw new ConflictException(
        'Cannot update to provided Username! User with provided username already exists!',
      );
    }

    if (updateUserDto.password) {
      const genSalt = await bcrypt.genSalt();
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        genSalt,
      );
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      { $set: updateUserDto },
      { new: true },
    );
    return updatedUser;
  }

  async delete(id: string): Promise<string> {
    const userToDel = await this.userModel.findByIdAndDelete(id);

    if (!userToDel) throw new NotFoundException('User could not be found!');
    return 'User deleted successfully';
  }
}
