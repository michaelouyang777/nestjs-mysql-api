import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { createWriteStream } from 'fs';
import * as path from 'path';
import moment = require('moment');
import * as fs from 'fs';
import { isObject } from './../../shared/utils';

@Injectable()
export class UploadFileService {
  /**
   * @param {any} files 客户端传递过来的上传文件
   * @param {string} category 创建文件的分类
   * @param {string[]} typeList 上传文件类型限制
   * @return:
   * @Description: 定义上传文件的公共方法
   * @Author: 水痕
   * @LastEditors: 水痕
   * @Date: 2019-08-07 11:00:10
   */
  public uploadFile({
    files,
    category = '',
    typeList = [],
  }: {
    files: any;
    category?: string;
    typeList?: string[];
  }):
    | { url: string; fileName: string }
    | Array<{ url: string; fileName: string }> {
    // 基础的目录
    const uplaodBasePath = 'public/uploads';
    // 根据格式生成文件夹
    const dirname = moment(Date.now()).format('YYYY/MM/DD');
    const filePath = path.join(uplaodBasePath, category, dirname)
    // 递归创建文件夹
    this.mkdirsSync(filePath);
    // 如果上传是单个文件
    if (isObject(files)) {
      return this.singleFile(filePath, files, typeList);
    } else if (Array.isArray(Array.from(files))) {
      return this.manyFile(filePath, files, typeList);
    } else {
      throw new HttpException('上传文件失败', HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * 多个文件上传
   * @param filePath 基础路径
   * @param files  上传文件
   * @param typeList  支持上传的类别
   */
  private manyFile(filePath: string, files: any, typeList: string[]): { url: string; fileName: string } | Array<{ url: string; fileName: string }> {
    if (files.length === 0) {
      return { url: '', fileName: '' };
    }
    const filenameList: Array<{ url: string; fileName: string }> = [];
    for (const file of files) {
      // 生成文件名
      const extname = path.extname(file.originalname).toLocaleLowerCase();
      // tslint:disable-next-line:radix
      const filename: string = `${Date.now()}${Number.parseInt(
        String(Math.random() * 1000),
      )}${extname}`;
      // 如果有文件格式约束就判断上传文件
      if (
        typeList.length &&
        !typeList.map(item => item.toLocaleLowerCase()).includes(extname)
      ) {
        throw new HttpException(
          `上传图片格式限制为:[${typeList}]其中一种,你上传的图片格式里包含了:${extname}`,
          HttpStatus.NOT_ACCEPTABLE,
        );
      }
      const target = path.join(filePath, filename);
      filenameList.push({ url: target.replace('public', '/static'), fileName: file.originalname });
      const writeImage = createWriteStream(target);
      writeImage.write(file.buffer);
    }
    return filenameList;
  }
  /**
   * 单个文件上传
   * @param filePath 基础路径
   * @param files  上传文件
   * @param typeList  支持上传的类别
   */
  private singleFile(filePath: string, files: any, typeList: string[]): { url: string; fileName: string } {
    // 生成文件名
    const extname = path.extname(files.originalname).toLocaleLowerCase();
    // tslint:disable-next-line:radix
    const filename: string = `${Date.now()}${Number.parseInt(
      String(Math.random() * 1000),
    )}${extname}`;
    // 如果有文件格式约束就判断上传文件
    if (
      typeList.length &&
      !typeList.map(item => item.toLocaleLowerCase()).includes(extname)
    ) {
      throw new HttpException(
        `上传图片格式限制为:[${typeList}]其中一种,你上传的图片格式为:${extname}`,
        HttpStatus.NOT_ACCEPTABLE,
      );
    }
    const target = path.join(filePath, filename);
    const writeImage = createWriteStream(target);
    writeImage.write(files.buffer);
    return { url: target.replace('public', '/static'), fileName: files.originalname };
  }
  /**
   * @param {type}
   * @return:
   * @Description: 递归创建文件夹
   * @Author: 水痕
   * @LastEditors: 水痕
   * @Date: 2019-08-07 10:20:16
   */
  private mkdirsSync(dirname: string): boolean {
    if (fs.existsSync(dirname)) {
      return true;
    } else {
      if (this.mkdirsSync(path.dirname(dirname))) {
        fs.mkdirSync(dirname);
        return true;
      }
    }
  }
}
