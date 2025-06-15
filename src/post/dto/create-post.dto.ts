import { IsString, IsEnum, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { PostCategory } from '../enum/post-category.enum';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(PostCategory)
  category: PostCategory;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  content: string;
}
