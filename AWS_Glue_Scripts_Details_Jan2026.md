# AWS Glue Scripts - January 2026 Work Details

## Overview
The **aws-glue-scripts** repository is a centralized data pipeline infrastructure for AWS Glue ETL jobs across multiple health and environmental data programs (IMACS, WHO, Global Fund, etc.). In January 2026, major work was done to expand data ingestion capabilities across multiple international data sources.

---

## Key Commits in January 2026

### 1. **World Bank Data Ingestion** (Early January - Commit: 156b2f2)
**Date:** January 2, 2026

**What was added:**
- World Bank data pipeline infrastructure
- 1,486 indicators tracked in `wb_indicators.json`
- Two main ETL jobs:
  - `wb_data_pipeline` - Main data ingestion pipeline (677 lines)
  - `wb_indicators_pipeline` - Indicators-specific processing (422 lines)
- Common libraries for S3, logging, and configuration management
- Deployment scripts (`deploy_s3.sh`, `package_zip.sh`)
- Example job templates for IMACS and WHO programs

**Files changed:** 20 files, 3,000+ lines added

**Purpose:** Enable ingestion of World Bank development indicators (economic, social, environmental metrics) for health modeling and analysis.

---

### 2. **Major Data Sources Expansion** (January 11, 2026 - Commit: ede1beb)
**Date:** January 11, 2026

**Massive expansion with 295,573+ lines of code added across 56 files**

#### **New Data Sources Integrated:**

##### **A. Climate & Environmental Data**
1. **ERA5 Climate Reanalysis** - European Centre for Medium-Range Weather Forecasts
   - Hourly and monthly climate data processing
   - Temperature, precipitation, wind, humidity metrics
   - Multiple processing pipelines:
     - `ear5_processing.py` (257 lines)
     - `era5_reanalysis_hourly.py` (350 lines)
     - `era5_reanalysis_monthly.py` (377 lines)
     - `era5_to_measurements_etl.py` (268 lines)

2. **OpenMeteo** - Open-source weather data
   - Country and river coordinates tracking (637 lines for rivers)
   - 167-line README with detailed job documentation
   - Flood risk data processing
   - Weather variables configuration (396 lines)

3. **Air Pollution Data**
   - `air_pollution_etl.py` (1,180 lines)
   - Integration with air quality monitoring networks
   - Detailed 359-line README

##### **B. Health Data Sources**
1. **IHME (Institute for Health Metrics and Evaluation)**
   - Internal migration data ETL (284 lines)
   - ZIP file extraction utilities (110 lines)
   - Migration data transformation pipeline (281 lines)
   - **276,650 lines of World Bank reference data** in `data.json`

2. **UNICEF** - Child health and development indicators
   - Main job processing (197 lines)
   - Indicators lookup job (155 lines)
   - Dev and prod configurations

3. **Population Data**
   - Population ETL pipeline (71 lines)
   - Geographic enrichment views

##### **C. Genomics & Genetic Data**
1. **IGSR (International Genome Sample Resource)**
   - Indicators job (645 lines)
   - Main processing job (1,302 lines)
   - SQL queries for:
     - Alignments, data collections, populations
     - Samples and sequence files
     - Multiple indicator views (collection, population, superpopulation, technology)
   - 456-line indicator insertion SQL

##### **D. Pharmaceutical & Health Economics**
1. **OECD Pharma & MedTech**
   - ETL job (782 lines)
   - 217-line job configuration
   - Reference indicators and data transformation SQL

#### **SQL & Analytics Infrastructure**
- **15+ Athena SQL scripts** for data warehouse management
- Derived variables schema (566 lines)
- Geographic population views
- Complex indicator aggregation queries

#### **Documentation**
- 5,545 lines of derived variables definitions in JSON
- 184-line summary of derived variables
- Comprehensive README files for each data source

---

### 3. **Environmental Disaster & Risk Data** (Late January - Commit: 0b7b66d)
**Date:** Late January 2026

**What was added (4,273+ lines):**

1. **UNDRR Sendai Framework Data** - UN Disaster Risk Reduction
   - Disaster event tracking and reporting
   - Sendai Framework indicator processing (1,571 lines)
   - Processing ETL pipeline (545 lines)
   - 137-line README with detailed documentation
   - Dev and prod configurations (61 lines each)

2. **OpenAQ Air Quality** - Real-time air quality data
   - Bulk ETL processing (937 lines)
   - Global air quality monitoring network integration

3. **OpenMeteo Flood Risk**
   - Flood measurements conversion (431 lines)
   - 149-line README
   - Dev (17 lines) and prod (55 lines) configurations

4. **ERA5 Monthly Processing**
   - Enhanced monthly climate data processing (304 lines)

---

## Work Done in January 2026 (Additional Context from File Timestamps)

### **Documentation & Guides Created:**
- `ARCHITECTURE_DIAGRAM.md` (14,372 bytes)
- `ARCHITECTURE_REVIEW.md` (73,717 bytes)
- `ATHENA_DATA_LOADING_PLAN.md` (30,452 bytes)
- `DATA_LOADING_GUIDE.md` (17,898 bytes)
- `DEPLOYMENT_GUIDE.md` (8,037 bytes)
- `EC2_DEPLOYMENT_GUIDE.md` (8,101 bytes)
- `EC2_SETUP_GUIDE.md` (11,975 bytes)
- `ERA5_ADMIN_QUERY_GUIDE.md` (14,046 bytes)
- `ERA5_SUBNATIONAL_QUERY_GUIDE.md` (12,901 bytes)
- `TB_AIRQUALITY_MVP_GUIDE.md` (14,710 bytes)
- `WHO_GHED_DATA_VALIDATION_REPORT.md` (4,644 bytes)
- `IHME_DATA_ISSUE_REPORT.md` (8,414 bytes)
- `IHME_ETL_UPDATE_SUMMARY.md` (9,601 bytes)

### **Utility Scripts & Tools:**
- `check_era5_data_availability.py` (13,389 bytes)
- `create_and_populate_dim_admin1.py` (10,309 bytes)
- `query_era5_by_admin_levels.py` (18,219 bytes)
- `query_era5_subnational.py` (17,789 bytes)
- `extract_citation_sections.py` (6,309 bytes)
- `verify_data_availability.py` and `verify_data_availability_fast.py`
- Migration data processing scripts

### **Large Datasets Processed:**
- **IHME Full Indicators:** 26.3 GB CSV file (26,337,366,728 bytes)
- **GlobalFund-IHME:** 147 MB CSV (147,192,037 bytes)
- **Multiple country-specific datasets:** Bangladesh, Sierra Leone, Niger
- Migration data for 2+ countries
- Climate measurements spanning 1990-2025

---

## Data Sources Summary

### **International Organizations:**
1. **World Bank** - Economic & development indicators
2. **WHO (World Health Organization)** - Health expenditure (GHED)
3. **UNICEF** - Child health and development
4. **UNDRR** - Disaster risk reduction (Sendai Framework)
5. **OECD** - Pharmaceutical and medical technology data

### **Research & Health:**
6. **IHME** - Global disease burden, migration, mortality
7. **IGSR** - International genomic sample resources

### **Climate & Environment:**
8. **ERA5** - European climate reanalysis
9. **OpenMeteo** - Weather and flood data
10. **OpenAQ** - Air quality monitoring

---

## Technical Architecture

### **ETL Pipeline Structure:**
- **Extract:** Pull data from external APIs and data sources
- **Transform:** Clean, validate, and standardize data formats
- **Load:** Store in S3 data lake and Athena-queryable format

### **Infrastructure:**
- **AWS Glue** - Serverless ETL processing
- **Amazon S3** - Data lake storage
- **Amazon Athena** - SQL querying
- **PostgreSQL** - Structured data storage

### **Development Practices:**
- Separate dev/prod configurations
- Comprehensive documentation for each job
- Shared utility libraries
- Automated deployment scripts
- Data validation and quality checks

---

## Impact & Scale

### **Lines of Code:** 300,000+ lines added in January 2026
### **Data Sources:** 10+ major international data providers
### **ETL Jobs:** 40+ distinct data pipeline jobs
### **Documentation:** 15+ comprehensive guides (200+ pages)
### **SQL Scripts:** 20+ Athena queries and views
### **Datasets:** 26+ GB of processed health and climate data

---

## Key Use Cases

1. **Climate-Health Modeling:** Correlate climate variables (temperature, precipitation) with health outcomes
2. **Tuberculosis & Air Quality:** TB prevalence vs air pollution analysis
3. **Disaster Impact:** Health outcomes following natural disasters (UNDRR data)
4. **Migration Patterns:** Health impacts of internal migration (IHME)
5. **Pharmaceutical Access:** OECD pharma data for health economics
6. **Genomic Research:** Population-level genetic variation (IGSR)
7. **Child Health:** UNICEF indicators for maternal and child health
8. **Global Health Expenditure:** WHO GHED financial data

---

## Technologies Used

- **Python** - Primary ETL scripting language
- **PySpark** - Big data processing (AWS Glue)
- **SQL** - Athena queries and data warehouse
- **Boto3** - AWS SDK for Python
- **Pandas** - Data manipulation
- **JSON** - Configuration and metadata
- **Shell Scripts** - Deployment automation

---

## Repository Statistics (January 2026)

- **Total Commits:** 4 major commits in January
- **Files Modified:** 80+ files
- **Data Processed:** 26+ GB
- **Job Count:** 40+ ETL pipelines
- **Active Development:** ~3 weeks of intensive work
