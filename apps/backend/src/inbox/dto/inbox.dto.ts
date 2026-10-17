import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateNested } from 'class-validator';
import { aiReplyModeValues, type AiReplyMode } from '../../db/schema';

export class ListConversationsDto {
  @IsOptional() @IsIn(['all', 'needs_you'])
  filter?: 'all' | 'needs_you';
}

export class ReplyDto {
  /** Instagram and Messenger cap text messages at 1,000 characters. */
  @IsString() @MinLength(1) @MaxLength(1000)
  text!: string;
}

export class SetAiPausedDto {
  @IsBoolean()
  paused!: boolean;
}

export class AiModesDto {
  @IsOptional() @IsIn(aiReplyModeValues)
  instagram?: AiReplyMode;

  @IsOptional() @IsIn(aiReplyModeValues)
  messenger?: AiReplyMode;

  @IsOptional() @IsIn(aiReplyModeValues)
  whatsapp?: AiReplyMode;
}

export class FaqEntryDto {
  @IsString() @MaxLength(300)
  question!: string;

  @IsString() @MaxLength(1000)
  answer!: string;
}

export class UpdateInboxSettingsDto {
  @IsOptional() @ValidateNested() @Type(() => AiModesDto)
  aiModes?: AiModesDto;

  @IsOptional() @IsArray() @ArrayMaxSize(40) @ValidateNested({ each: true }) @Type(() => FaqEntryDto)
  faq?: FaqEntryDto[];
}
