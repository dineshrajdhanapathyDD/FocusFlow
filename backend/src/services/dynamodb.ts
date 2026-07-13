import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';

const client = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: { removeUndefinedValues: true },
});

const TASKS_TABLE = process.env.TASKS_TABLE || 'FocusFlow-Tasks';
const PLANS_TABLE = process.env.PLANS_TABLE || 'FocusFlow-Plans';
const INSIGHTS_TABLE = process.env.INSIGHTS_TABLE || 'FocusFlow-Insights';
const NOTIFICATIONS_TABLE = process.env.NOTIFICATIONS_TABLE || 'FocusFlow-Notifications';

// ===== Tasks =====
export async function getTasksByUser(userId: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: TASKS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
    })
  );
  return result.Items || [];
}

export async function getTaskById(userId: string, taskId: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: TASKS_TABLE,
      Key: { userId, id: taskId },
    })
  );
  return result.Item;
}

export async function createTask(task: Record<string, unknown>) {
  await ddb.send(
    new PutCommand({
      TableName: TASKS_TABLE,
      Item: task,
    })
  );
  return task;
}

export async function updateTask(userId: string, taskId: string, updates: Record<string, unknown>) {
  const updateExpressions: string[] = [];
  const expressionNames: Record<string, string> = {};
  const expressionValues: Record<string, unknown> = {};

  Object.entries(updates).forEach(([key, value]) => {
    const attrName = `#${key}`;
    const attrValue = `:${key}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionNames[attrName] = key;
    expressionValues[attrValue] = value;
  });

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TASKS_TABLE,
      Key: { userId, id: taskId },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: 'ALL_NEW',
    })
  );
  return result.Attributes;
}

export async function deleteTask(userId: string, taskId: string) {
  await ddb.send(
    new DeleteCommand({
      TableName: TASKS_TABLE,
      Key: { userId, id: taskId },
    })
  );
}

// ===== Plans =====
export async function getDailyPlan(userId: string, date: string) {
  const result = await ddb.send(
    new GetCommand({
      TableName: PLANS_TABLE,
      Key: { userId, date },
    })
  );
  return result.Item;
}

export async function savePlan(plan: Record<string, unknown>) {
  await ddb.send(
    new PutCommand({
      TableName: PLANS_TABLE,
      Item: plan,
    })
  );
  return plan;
}

// ===== Insights =====
export async function getInsightsByUser(userId: string, limit = 20) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: INSIGHTS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,
      Limit: limit,
    })
  );
  return result.Items || [];
}

export async function saveInsight(insight: Record<string, unknown>) {
  await ddb.send(
    new PutCommand({
      TableName: INSIGHTS_TABLE,
      Item: insight,
    })
  );
  return insight;
}

// ===== Notifications =====
export async function getNotificationsByUser(userId: string) {
  const result = await ddb.send(
    new QueryCommand({
      TableName: NOTIFICATIONS_TABLE,
      KeyConditionExpression: 'userId = :uid',
      ExpressionAttributeValues: { ':uid': userId },
      ScanIndexForward: false,
      Limit: 50,
    })
  );
  return result.Items || [];
}

export async function markNotificationRead(userId: string, notificationId: string) {
  await ddb.send(
    new UpdateCommand({
      TableName: NOTIFICATIONS_TABLE,
      Key: { userId, id: notificationId },
      UpdateExpression: 'SET #read = :read',
      ExpressionAttributeNames: { '#read': 'read' },
      ExpressionAttributeValues: { ':read': true },
    })
  );
}
