import { IsObject, IsOptional, IsArray, IsNumber, IsString } from 'class-validator';

export class SyncPullDto {
  @IsNumber()
  @IsOptional()
  lastPulledAt?: number;

  @IsNumber()
  @IsOptional()
  schemaVersion?: number;

  @IsOptional()
  migration?: unknown;
}

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
