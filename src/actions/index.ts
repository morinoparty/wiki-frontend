// Core API Functions
export { createPost } from "./create-post";
export { updatePost } from "./update-post";
export { lockPost, unlockPost } from "./lock-post";
export {
  changePostStatus,
  transferPostOwnership,
  deletePost,
} from "./manage-post";
export { getPostHistory, restorePostVersion, getPostDiff } from "./history";

// Query Functions
export {
  getAllPosts,
  getPost,
  getPostsByCategory,
  searchPosts,
  getUserPosts,
} from "./queries";

// Batch Operations
export {
  batchDeletePosts,
  batchChangePostsStatus,
  duplicatePost,
} from "./batch-operations";

// Statistics & Monitoring
export { getSystemStats, getUserStats, healthCheck } from "./stats";

// Service Classes
export { GitHubService } from "./services/github-service";
export { AuthService } from "./services/auth-service";
export { ValidationService } from "./services/validation-service";
export { PermissionService } from "./services/permission-service";

// Types
export type {
  ApiResult,
  Permission,
  OperationContext,
  CreatePostInput,
  UpdatePostInput,
  LockOperationInput,
  StatusChangeInput,
  OwnershipTransferInput,
  PostHistoryItem,
  ValidationError,
} from "./types";

export type { SystemStats, UserStats } from "./stats";

// Legacy function has been removed - use createPost/updatePost instead
