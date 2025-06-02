import { CreatePostInput, UpdatePostInput, ValidationError } from "../types";

export class ValidationService {
  /**
   * 記事作成時の入力データを検証
   */
  static validateCreateInput(input: CreatePostInput): {
    success: boolean;
    error?: string;
    errors?: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // 必須フィールドの検証
    if (!input.title?.trim()) {
      errors.push({ field: "title", message: "タイトルは必須です" });
    }
    if (!input.slug?.trim()) {
      errors.push({ field: "slug", message: "スラッグは必須です" });
    }
    if (!input.body?.trim()) {
      errors.push({ field: "body", message: "本文は必須です" });
    }
    if (!input.category?.trim()) {
      errors.push({ field: "category", message: "カテゴリは必須です" });
    }
    if (!input.description?.trim()) {
      errors.push({ field: "description", message: "説明は必須です" });
    }

    // 文字数制限の検証
    if (input.title && input.title.length > 200) {
      errors.push({
        field: "title",
        message: "タイトルは200文字以内で入力してください",
      });
    }
    if (input.slug && input.slug.length > 100) {
      errors.push({
        field: "slug",
        message: "スラッグは100文字以内で入力してください",
      });
    }
    if (input.description && input.description.length > 500) {
      errors.push({
        field: "description",
        message: "説明は500文字以内で入力してください",
      });
    }

    // スラッグの形式検証
    if (input.slug && !this.isValidSlug(input.slug)) {
      errors.push({
        field: "slug",
        message: "スラッグは英数字、ハイフン、アンダースコアのみ使用できます",
      });
    }

    // ステータスの検証
    if (
      input.status &&
      !["draft", "published", "archived"].includes(input.status)
    ) {
      errors.push({ field: "status", message: "無効なステータスです" });
    }

    // 可視性の検証
    if (
      input.visibility &&
      !["public", "private", "restricted"].includes(input.visibility)
    ) {
      errors.push({ field: "visibility", message: "無効な可視性設定です" });
    }

    // 優先度の検証
    if (input.priority && !["low", "medium", "high"].includes(input.priority)) {
      errors.push({ field: "priority", message: "無効な優先度です" });
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: `入力データに問題があります: ${errors.map((e) => e.message).join(", ")}`,
        errors,
      };
    }

    return { success: true };
  }

  /**
   * 記事更新時の入力データを検証
   */
  static validateUpdateInput(input: UpdatePostInput): {
    success: boolean;
    error?: string;
    errors?: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    // スラッグは必須
    if (!input.slug?.trim()) {
      errors.push({ field: "slug", message: "スラッグは必須です" });
    }

    // 提供されたフィールドの検証
    if (input.title !== undefined) {
      if (!input.title.trim()) {
        errors.push({ field: "title", message: "タイトルが空です" });
      } else if (input.title.length > 200) {
        errors.push({
          field: "title",
          message: "タイトルは200文字以内で入力してください",
        });
      }
    }

    if (input.slug && input.slug.length > 100) {
      errors.push({
        field: "slug",
        message: "スラッグは100文字以内で入力してください",
      });
    }

    if (input.description !== undefined) {
      if (!input.description.trim()) {
        errors.push({ field: "description", message: "説明が空です" });
      } else if (input.description.length > 500) {
        errors.push({
          field: "description",
          message: "説明は500文字以内で入力してください",
        });
      }
    }

    if (input.body !== undefined && !input.body.trim()) {
      errors.push({ field: "body", message: "本文が空です" });
    }

    if (input.category !== undefined && !input.category.trim()) {
      errors.push({ field: "category", message: "カテゴリが空です" });
    }

    // スラッグの形式検証
    if (input.slug && !this.isValidSlug(input.slug)) {
      errors.push({
        field: "slug",
        message: "スラッグは英数字、ハイフン、アンダースコアのみ使用できます",
      });
    }

    // ステータスの検証
    if (
      input.status &&
      !["draft", "published", "archived"].includes(input.status)
    ) {
      errors.push({ field: "status", message: "無効なステータスです" });
    }

    // 可視性の検証
    if (
      input.visibility &&
      !["public", "private", "restricted"].includes(input.visibility)
    ) {
      errors.push({ field: "visibility", message: "無効な可視性設定です" });
    }

    // 優先度の検証
    if (input.priority && !["low", "medium", "high"].includes(input.priority)) {
      errors.push({ field: "priority", message: "無効な優先度です" });
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: `入力データに問題があります: ${errors.map((e) => e.message).join(", ")}`,
        errors,
      };
    }

    return { success: true };
  }

  /**
   * スラッグの形式が有効かチェック
   */
  private static isValidSlug(slug: string): boolean {
    // 基本的な英数字、ハイフン、アンダースコア、日本語を許可
    const slugPattern =
      /^[a-zA-Z0-9_\-\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]+$/;
    return slugPattern.test(slug);
  }

  /**
   * 画像URLの形式をチェック
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
