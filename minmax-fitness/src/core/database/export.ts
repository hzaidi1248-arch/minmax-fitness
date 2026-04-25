/**
 * @module core/database/export
 * @description Utility to export the entire WatermelonDB database to a JSON file.
 * Provides user data ownership and audit capabilities.
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

import database from '@core/database';
import { TableName } from '@core/types';

export async function exportDatabaseToJson(): Promise<void> {
  try {
    const exportData: Record<string, any[]> = {};

    // List all tables we want to export
    const tables = [
      TableName.USERS,
      TableName.PROGRAMS,
      TableName.EXERCISES,
      TableName.WORKOUT_SESSIONS,
      TableName.SET_LOGS,
      TableName.BODYWEIGHT_LOGS,
    ];

    for (const table of tables) {
      const collection = database.get(table);
      const records = await collection.query().fetch();
      exportData[table] = records.map((record) => record._raw);
    }

    const jsonString = JSON.stringify(exportData, null, 2);
    const fileName = `minmax_export_${new Date().toISOString().split('T')[0]}.json`;
    const fileUri = `${FileSystem.documentDirectory || ''}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, jsonString, {
      encoding: 'utf8',
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/json',
        dialogTitle: 'Export Min-Max Data',
      });
    } else {
      Alert.alert('Export Complete', `File saved locally to ${fileUri}`);
    }

  } catch (error) {
    console.error('Export failed:', error);
    Alert.alert('Export Failed', 'An error occurred while exporting your data.');
  }
}
