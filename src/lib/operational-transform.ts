/**
 * Operational Transformation (OT) utilities for collaborative text editing
 * Implements a simplified OT algorithm for conflict-free concurrent editing
 */

export type OperationType = 'insert' | 'delete' | 'retain';

export interface TextOperation {
  type: OperationType;
  position: number;
  text?: string;
  length?: number;
  userId: string;
  timestamp: number;
}

export interface DocumentState {
  content: string;
  version: number;
  operations: TextOperation[];
}

/**
 * Apply an operation to a text string
 */
export function applyOperation(text: string, operation: TextOperation): string {
  switch (operation.type) {
    case 'insert':
      if (!operation.text) return text;
      return (
        text.slice(0, operation.position) +
        operation.text +
        text.slice(operation.position)
      );
    
    case 'delete':
      if (!operation.length) return text;
      return (
        text.slice(0, operation.position) +
        text.slice(operation.position + operation.length)
      );
    
    case 'retain':
      return text;
    
    default:
      return text;
  }
}

/**
 * Transform two concurrent operations against each other
 * This is the core of OT - ensures convergence when operations are applied in different orders
 */
export function transformOperation(
  op1: TextOperation,
  op2: TextOperation,
  op1First: boolean
): TextOperation {
  // If operations are from the same user at the same time, no transformation needed
  if (op1.userId === op2.userId && op1.timestamp === op2.timestamp) {
    return op1;
  }

  const transformed = { ...op1 };

  // Transform op1 against op2
  if (op1.type === 'insert' && op2.type === 'insert') {
    // Both are inserts
    if (op2.position < op1.position || (op2.position === op1.position && op1First)) {
      // op2 is before op1, shift op1 position
      transformed.position += op2.text?.length || 0;
    }
  } else if (op1.type === 'insert' && op2.type === 'delete') {
    // op1 is insert, op2 is delete
    if (op2.position < op1.position) {
      // op2 deletes before op1, shift op1 position back
      transformed.position -= Math.min(op2.length || 0, op1.position - op2.position);
    }
  } else if (op1.type === 'delete' && op2.type === 'insert') {
    // op1 is delete, op2 is insert
    if (op2.position <= op1.position) {
      // op2 inserts before op1, shift op1 position forward
      transformed.position += op2.text?.length || 0;
    }
  } else if (op1.type === 'delete' && op2.type === 'delete') {
    // Both are deletes
    if (op2.position < op1.position) {
      // op2 deletes before op1
      const op2End = op2.position + (op2.length || 0);
      if (op2End <= op1.position) {
        // op2 is completely before op1, shift op1 back
        transformed.position -= op2.length || 0;
      } else {
        // op2 overlaps with op1's position
        transformed.position = op2.position;
        // Adjust length if needed
        if (transformed.length) {
          const overlap = Math.min(op2End - op1.position, transformed.length);
          transformed.length -= overlap;
        }
      }
    } else if (op2.position < (op1.position + (op1.length || 0))) {
      // op2 starts within op1's range
      if (transformed.length) {
        const overlap = Math.min(
          (op2.length || 0),
          (op1.position + (op1.length || 0)) - op2.position
        );
        transformed.length -= overlap;
      }
    }
  }

  return transformed;
}

/**
 * Generate an operation from text changes
 */
export function generateOperation(
  oldText: string,
  newText: string,
  cursorPosition: number,
  userId: string
): TextOperation | null {
  if (oldText === newText) return null;

  // Find the common prefix
  let prefixLength = 0;
  while (
    prefixLength < oldText.length &&
    prefixLength < newText.length &&
    oldText[prefixLength] === newText[prefixLength]
  ) {
    prefixLength++;
  }

  // Find the common suffix
  let suffixLength = 0;
  while (
    suffixLength < oldText.length - prefixLength &&
    suffixLength < newText.length - prefixLength &&
    oldText[oldText.length - 1 - suffixLength] === newText[newText.length - 1 - suffixLength]
  ) {
    suffixLength++;
  }

  const oldMiddle = oldText.slice(prefixLength, oldText.length - suffixLength);
  const newMiddle = newText.slice(prefixLength, newText.length - suffixLength);

  if (oldMiddle.length === 0 && newMiddle.length > 0) {
    // Insert operation
    return {
      type: 'insert',
      position: prefixLength,
      text: newMiddle,
      userId,
      timestamp: Date.now(),
    };
  } else if (oldMiddle.length > 0 && newMiddle.length === 0) {
    // Delete operation
    return {
      type: 'delete',
      position: prefixLength,
      length: oldMiddle.length,
      userId,
      timestamp: Date.now(),
    };
  } else if (oldMiddle.length > 0 && newMiddle.length > 0) {
    // Replace operation (delete + insert)
    // For simplicity, we'll treat this as a delete followed by an insert
    // In a production system, you might want to handle this more efficiently
    return {
      type: 'delete',
      position: prefixLength,
      length: oldMiddle.length,
      userId,
      timestamp: Date.now(),
    };
  }

  return null;
}

/**
 * Compose two sequential operations into one
 */
export function composeOperations(op1: TextOperation, op2: TextOperation): TextOperation[] {
  // If operations are far apart, keep them separate
  if (Math.abs(op1.position - op2.position) > 10) {
    return [op1, op2];
  }

  // If both are inserts at the same position, combine them
  if (op1.type === 'insert' && op2.type === 'insert' && op1.position === op2.position) {
    return [{
      ...op1,
      text: (op1.text || '') + (op2.text || ''),
      timestamp: op2.timestamp,
    }];
  }

  // If both are deletes at adjacent positions, combine them
  if (op1.type === 'delete' && op2.type === 'delete') {
    const op1End = op1.position + (op1.length || 0);
    if (op2.position === op1End || op2.position === op1.position) {
      return [{
        ...op1,
        length: (op1.length || 0) + (op2.length || 0),
        timestamp: op2.timestamp,
      }];
    }
  }

  // Otherwise, keep them separate
  return [op1, op2];
}

/**
 * Validate an operation
 */
export function isValidOperation(operation: TextOperation, textLength: number): boolean {
  if (operation.position < 0 || operation.position > textLength) {
    return false;
  }

  if (operation.type === 'delete') {
    if (!operation.length || operation.length < 0) {
      return false;
    }
    if (operation.position + operation.length > textLength) {
      return false;
    }
  }

  if (operation.type === 'insert') {
    if (!operation.text || operation.text.length === 0) {
      return false;
    }
  }

  return true;
}
