import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Signature {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nome!: string;

  @Column()
  cargo!: string;

  @Column()
  telefone1!: string;

  @Column({ nullable: true })
  telefone2!: string;

  @Column()
  imagem!: string;

  @Column({ type: "varchar", nullable: true })
  imagemArquivo!: string | null;

  @Column({ type: "varchar", nullable: true })
  imagemPath!: string | null;
}
