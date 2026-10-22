import {
  CreatePostInput,
  UpdatePostInput,
  ValidationError,
  CreatePostInputSchema,
  UpdatePostInputSchema,
} from "@/server/types";
import { ZodError } from "zod";

export class ValidationService {
  /**
   * ZodエラーをValidationErrorの配列に変換
   */
  private static zodErrorToValidationErrors(
    error: ZodError
  ): ValidationError[] {
    return error.issues.map((err) => ({
      field: err.path.join("."),
      message: err.message,
    }));
  }

  /**
   * 記事作成時の入力データを検証
   */
  static validateCreateInput(input: CreatePostInput): {
    success: boolean;
    error?: string;
    errors?: ValidationError[];
  } {
    try {
      CreatePostInputSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = this.zodErrorToValidationErrors(error);
        return {
          success: false,
          error: `入力データに問題があります: ${errors.map((e) => e.message).join(", ")}`,
          errors,
        };
      }
      return {
        success: false,
        error: "入力データの検証中にエラーが発生しました",
      };
    }
  }

  /**
   * 記事更新時の入力データを検証
   */
  static validateUpdateInput(input: UpdatePostInput): {
    success: boolean;
    error?: string;
    errors?: ValidationError[];
  } {
    try {
      UpdatePostInputSchema.parse(input);
      return { success: true };
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = this.zodErrorToValidationErrors(error);
        return {
          success: false,
          error: `入力データに問題があります: ${errors.map((e) => e.message).join(", ")}`,
          errors,
        };
      }
      return {
        success: false,
        error: "入力データの検証中にエラーが発生しました",
      };
    }
  }

  /**
   * 画像URLの形式をチェック（後方互換性のため保持）
   */
  static isValidImageUrl(url: string): boolean {
    try {
      new URL(url);
      return /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(url);
    } catch {
      return false;
    }
  }
}
