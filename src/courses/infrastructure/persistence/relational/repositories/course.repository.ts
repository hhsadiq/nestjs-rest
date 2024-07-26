import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CourseEntity } from '../entities/course.entity';
import { NullableType } from '../../../../../utils/types/nullable.type';
import { Course } from '../../../../domain/course';
import { CourseRepository } from '../../course.repository';
import { CourseMapper } from '../mappers/course.mapper';
import { IPaginationOptions } from '../../../../../utils/types/pagination-options';

@Injectable()
export class CourseRelationalRepository implements CourseRepository {
  constructor(
    @InjectRepository(CourseEntity)
    private readonly courseRepository: Repository<CourseEntity>,
  ) {}

  async create(data: Course): Promise<Course> {
    const persistenceModel = CourseMapper.toPersistence(data);
    const newEntity = await this.courseRepository.save(
      this.courseRepository.create(persistenceModel),
    );
    return CourseMapper.toDomain(newEntity);
  }

  async findAllWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Course[]> {
    const entities = await this.courseRepository.find({
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((user) => CourseMapper.toDomain(user));
  }

  async findAllNamesWithPagination({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Course[]> {
    const entities = await this.courseRepository.find({
      select: ['name'],
      skip: (paginationOptions.page - 1) * paginationOptions.limit,
      take: paginationOptions.limit,
    });

    return entities.map((user) => CourseMapper.toDomainName(user));
  }

  async findAllNamesWithPaginationRaw({
    paginationOptions,
  }: {
    paginationOptions: IPaginationOptions;
  }): Promise<Course[]> {
    const offset = (paginationOptions.page - 1) * paginationOptions.limit;
    const limit = paginationOptions.limit;

    const query = `
      SELECT *
      FROM course
      LIMIT $1 OFFSET $2
    `;

    const rawData = await this.courseRepository.query(query, [limit, offset]);
    return rawData.map((course: any) => CourseMapper.toDomain(course));
  }

  async findById(id: Course['id']): Promise<NullableType<Course>> {
    const entity = await this.courseRepository.findOne({
      where: { id },
    });

    return entity ? CourseMapper.toDomain(entity) : null;
  }

  async update(id: Course['id'], payload: Partial<Course>): Promise<Course> {
    const entity = await this.courseRepository.findOne({
      where: { id },
    });

    if (!entity) {
      throw new Error('Record not found');
    }

    const updatedEntity = await this.courseRepository.save(
      this.courseRepository.create(
        CourseMapper.toPersistence({
          ...CourseMapper.toDomain(entity),
          ...payload,
        }),
      ),
    );

    return CourseMapper.toDomain(updatedEntity);
  }

  async remove(id: Course['id']): Promise<void> {
    await this.courseRepository.delete(id);
  }
}
