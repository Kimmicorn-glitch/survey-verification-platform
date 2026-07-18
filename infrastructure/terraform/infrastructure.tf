module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "${var.environment}-svp-vpc"
  cidr = var.vpc_cidr
  azs  = var.availability_zones

  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway   = true
  single_nat_gateway   = var.environment != "production"
  enable_dns_hostnames = true
  enable_dns_support   = true

  public_subnet_tags = {
    "kubernetes.io/role/elb" = 1
  }

  private_subnet_tags = {
    "kubernetes.io/role/internal-elb" = 1
  }

  tags = {
    Environment = var.environment
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 20.0"

  cluster_name    = "${var.environment}-svp-cluster"
  cluster_version = "1.29"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets

  cluster_endpoint_public_access = true

  eks_managed_node_groups = {
    general = {
      desired_size = 3
      min_size     = 2
      max_size     = 10

      instance_types = ["t3.large"]
      capacity_type  = "ON_DEMAND"

      labels = {
        role = "general"
      }
    }

    compute = {
      desired_size = 2
      min_size     = 1
      max_size     = 5

      instance_types = ["c5.2xlarge"]
      capacity_type  = "ON_DEMAND"

      labels = {
        role = "compute"
      }

      taints = [{
        key    = "workload"
        value  = "ai-engine"
        effect = "NO_SCHEDULE"
      }]
    }
  }

  cluster_addons = {
    coredns = {
      most_recent = true
    }
    kube-proxy = {
      most_recent = true
    }
    vpc-cni = {
      most_recent = true
    }
    aws-ebs-csi-driver = {
      most_recent = true
    }
  }

  tags = {
    Environment = var.environment
  }
}

module "rds" {
  source  = "terraform-aws-modules/rds/aws"
  version = "~> 6.0"

  identifier = "${var.environment}-svp-db"

  engine               = "postgres"
  engine_version       = "16.1"
  family               = "postgres16"
  major_engine_version = "16"
  instance_class       = "db.r6g.large"

  allocated_storage     = 100
  max_allocated_storage = 500
  storage_encrypted     = true

  db_name  = "surveyplatform"
  username = "svp_admin"
  port     = 5432

  multi_az               = true
  db_subnet_group_name   = module.vpc.database_subnet_group_name
  vpc_security_group_ids = [module.vpc.default_security_group_id]

  maintenance_window      = "Mon:00:00-Mon:03:00"
  backup_window           = "03:00-06:00"
  backup_retention_period = 30
  deletion_protection     = true

  performance_insights_enabled          = true
  performance_insights_retention_period = 7

  tags = {
    Environment = var.environment
  }
}

module "elasticache" {
  source  = "terraform-aws-modules/elasticache/aws"
  version = "~> 1.0"

  replication_group_id = "${var.environment}-svp-redis"
  description          = "Redis cluster for Survey Verification Platform"

  node_type            = "cache.r6g.large"
  num_cache_clusters   = 2
  port                 = 6379

  automatic_failover_enabled = true
  multi_az_enabled           = true
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  subnet_group_name  = module.vpc.elasticache_subnet_group_name
  security_group_ids = [module.vpc.default_security_group_id]

  tags = {
    Environment = var.environment
  }
}

output "vpc_id" {
  value = module.vpc.vpc_id
}

output "eks_cluster_endpoint" {
  value = module.eks.cluster_endpoint
}

output "rds_endpoint" {
  value = module.rds.db_instance_endpoint
}

output "redis_endpoint" {
  value = module.elasticache.primary_endpoint_address
}
