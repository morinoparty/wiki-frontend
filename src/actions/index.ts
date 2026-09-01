// Core API Functions
export { createPost } from "./create-post";
export { updatePost } from "./update-post";
export { getPostHistory, restorePostVersion, getPostDiff } from "./history";

// Query Functions
export { getPostForEdit } from "./queries";

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
  PostHistoryItem,
  ValidationError,
} from "./types";
