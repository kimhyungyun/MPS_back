import { IsString, IsNotEmpty } from 'class-validator';

export class FindIdDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  phone: string;
}
