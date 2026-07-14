// import { Inject, Injectable } from '@nestjs/common';
// import type { CreateUserDto } from '@packages/entities';
// import { drizzle } from 'drizzle-orm/singlestore';
// import { DRIZZLE } from 'src/database/database.module';
// import { users } from 'src/database/schema';
// import { uuidv4 as v4 } from 'uuid';

// @Injectable()
// export class UserReposirory {
//   constructor(@Inject(DRIZZLE) private readonly db: ReturnType<typeof drizzle>) {}

//   // async create(data: Omit<CreateUserDto>) {
//   //     const [user] = await this.db.insert(users).values({
//   //         id: uuidv4(),

//   //   );
//   // }
// }
