import { ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { contentPlatformValues, contentPostStatusValues } from '../../db/schema';
import { CAPTION_TONE_IDS } from '../caption-writer';

export const MEDIA_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
/** Claude accepts images up to 5 MB; base64 adds a third, so cap the raw file at ~3.7 MB. */
export const MEDIA_MAX_BASE64_CHARS = 5_000_000;

export class UploadMediaDto {
  @IsIn(MEDIA_MIME_TYPES, { message: 'Use a JPEG, PNG or WebP image.' })
  mimeType!: string;

  @IsString()
  @MaxLength(MEDIA_MAX_BASE64_CHARS, { message: 'That photo is too large. Choose one under 3.5 MB.' })
  dataBase64!: string;
}

export class GenerateCaptionDto {
  /** Optional with a photo: Claude writes from what the photo shows. Needed when there's no photo. */
  @IsOptional() @IsString() @MaxLength(1000)
  brief?: string;

  @IsIn(CAPTION_TONE_IDS)
  tone!: string;

  @IsArray() @ArrayMaxSize(4) @IsIn(contentPlatformValues, { each: true })
  platforms!: string[];

  @IsOptional() @IsUUID()
  mediaId?: string;
}

export class SavePostDto {
  @IsOptional() @IsUUID()
  mediaId?: string | null;

  @IsOptional() @IsString() @MaxLength(1000)
  brief?: string | null;

  @IsOptional() @IsIn(CAPTION_TONE_IDS)
  tone?: string | null;

  @IsOptional() @IsString() @MaxLength(63206)
  caption?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(60) @IsString({ each: true }) @MaxLength(100, { each: true })
  hashtags?: string[];

  @IsOptional() @IsString() @MaxLength(300)
  callToAction?: string | null;

  @IsOptional() @IsArray() @ArrayMaxSize(4) @IsIn(contentPlatformValues, { each: true })
  platforms?: string[];

  /** Set when any of the caption text came from AI. */
  @IsOptional() @IsBoolean()
  aiGenerated?: boolean;
}

export class PlanPostDto {
  @IsDateString()
  plannedFor!: string;
}

export class MarkPostedDto {
  @IsArray() @ArrayMaxSize(4) @IsIn(contentPlatformValues, { each: true })
  platforms!: string[];
}

export class ListPostsDto {
  @IsOptional() @IsIn(contentPostStatusValues)
  status?: string;

  /** Calendar range: posts planned for, or posted, within [from, to]. */
  @IsOptional() @IsDateString()
  from?: string;

  @IsOptional() @IsDateString()
  to?: string;
}
