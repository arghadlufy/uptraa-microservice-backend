import DataUriParser from "datauri/parser.js";
import path from "path";

export const getBuffer = (file: Express.Multer.File | undefined | null) => {
  if (!file) return null;

  const parser = new DataUriParser();
  const extName = path.extname(file.originalname).toString();
  const buffer = parser.format(extName, file.buffer);
  return buffer;
};
