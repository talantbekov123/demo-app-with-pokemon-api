import { Body, Controller, Post, Res, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post('/some-endpoint')
  async handlePost(@Body() body: any, @Res() res: Response): Promise<void> {
    const { data } = body;

    if (!Array.isArray(data)) {
      res
        .status(HttpStatus.BAD_REQUEST)
        .json({ message: 'Invalid input data. Must be an array.' });
      return;
    }

    try {
      const results = await this.appService.processArray(data); // Start processing
      res.json({ message: 'Request processed successfully', results });
    } catch (error) {
      console.error('Error processing request:', error);
      res
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ message: 'Internal server error' });
    }
  }
}
