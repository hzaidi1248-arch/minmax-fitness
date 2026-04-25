import { IsObject, IsOptional, IsArray, IsNumber, IsString } from 'class-validator';

export class SyncTableChangeDto {
  @IsArray()
  @IsOptional()
  created?: any[];

  @IsArray()
  @IsOptional()
  updated?: any[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deleted?: string[];
}

export class SyncPushDto {
  @IsObject()
  changes: Record<string, SyncTableChangeDto>;

  @IsNumber()
  lastPulledAt: number;
}
