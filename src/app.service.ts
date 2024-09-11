import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AppService {
  private cachedResults: Record<string, any> = {};

  async processItem(item: any): Promise<any> {
    if (item.type === 'http') {
      // Handle HTTP request
      try {
        const response = await axios.get(item.url);
        this.cachedResults[item.url] = response.data; // Save response for future use
        return { url: item.url, data: response.data }; // Return result
      } catch (error) {
        console.error(`Error fetching URL ${item.url}:`, error);
        return { url: item.url, error: `Failed to fetch ${item.url}` }; // Return error message
      }
    } else if (item.type === 'condition') {
      // Handle condition logic
      const conditionResult = this.evaluateCondition(item.condition);
      if (conditionResult) {
        return this.processArray(item.isTrue); // Execute ifTrue branch
      } else {
        return this.processArray(item.ifFalse); // Execute ifFalse branch
      }
    } else {
      console.error('Unknown type:', item.type);
      return { error: 'Unknown type' }; // Return error message
    }
  }

  evaluateCondition(condition: string): boolean {
    try {
      const replacedCondition = condition.replace(
        /result\['([^']+)'\]((\.[a-zA-Z0-9_]+)*)/g,
        (match, url, properties) => {
          if (this.cachedResults[url] !== undefined) {
            let value = this.cachedResults[url];
            if (properties) {
              properties = properties.split('.').filter(Boolean);
              for (const prop of properties) {
                value = value ? value[prop] : undefined;
              }
            }
            return value !== undefined ? value : 'undefined';
          }
          return 'undefined';
        },
      );

      return this.safeEval(replacedCondition);
    } catch (error) {
      console.error(`Error evaluating condition "${condition}":`, error);
      return false;
    }
  }

  safeEval(expression: string): boolean {
    // Basic security: only allow arithmetic and logical operators
    const allowedChars = /^[0-9+\-*/%()!&|<> ]+$/;
    if (!allowedChars.test(expression)) {
      throw new Error('Invalid characters in expression');
    }

    // Evaluate expression safely
    return new Function('return ' + expression)();
  }

  async processArray(items: any[]): Promise<any[]> {
    const results = [];
    for (const item of items) {
      results.push(await this.processItem(item)); // Process each item individually
    }
    return results;
  }
}
