export type EntityType = 'user' | 'role' | 'policy' | 'group';
export type ResourceType = 'policy' | 'user';

export type AttachableEntity = {
  name: string;
  id: string;
  type: EntityType;
  disableDetach?: boolean;
};

export enum AttachmentAction {
  ADD,
  REMOVE,
}

export type AttachmentOperation = {
  action: AttachmentAction;
  entity: AttachableEntity;
};
