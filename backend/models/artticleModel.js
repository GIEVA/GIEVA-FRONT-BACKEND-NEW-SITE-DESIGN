import { DataTypes } from "sequelize";

export default (sequelize) => {

  const Article =
    sequelize.define(
      "Article",
      {

        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true,
        },



        // ======================================================
        // CONTENT
        // ======================================================

        title: {
          type: DataTypes.STRING,
          allowNull: false,
        },

        subtitle:
          DataTypes.STRING,

        slug: {
          type: DataTypes.STRING,
          unique: true,
          allowNull: false,
        },

        excerpt: {
          type: DataTypes.TEXT,
        },

      content: {
          type: DataTypes.TEXT("long"),
          allowNull: false,
        },


        // ======================================================
        // MEDIA
        // ======================================================

        coverImageUrl:
          DataTypes.TEXT,

        coverImagePublicId:
          DataTypes.TEXT,



        // ======================================================
        // SEO
        // ======================================================

        seoTitle:
          DataTypes.STRING,

        seoDescription:
          DataTypes.TEXT,

        seoKeywords: {
          type: DataTypes.JSON,
          defaultValue: [],
        },



        // ======================================================
        // CATEGORIZATION
        // ======================================================

        category:
          DataTypes.STRING,

        tags: {
          type: DataTypes.JSON,
          defaultValue: [],
        },



        // ======================================================
        // FEATURED
        // ======================================================

        isFeatured: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

        featuredOrder: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },



        // ======================================================
        // READING
        // ======================================================

        readingTime:
          DataTypes.STRING,



        // ======================================================
        // ANALYTICS
        // ======================================================

        views: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        likes: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },

        shares: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
        },



        // ======================================================
        // AUTHOR
        // ======================================================

        authorId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },



        // ======================================================
        // STATUS
        // ======================================================

        status: {
          type: DataTypes.ENUM(
            "draft",
            "review",
            "scheduled",
            "published",
            "archived"
          ),

          defaultValue:
            "draft",
        },



        // ======================================================
        // PUBLISHING
        // ======================================================

        publishedAt:
          DataTypes.DATE,

        scheduledPublishAt:
          DataTypes.DATE,



        // ======================================================
        // FLAGS
        // ======================================================

        allowComments: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
        },

        isPinned: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
        },

      },

      {
        paranoid: true,
        timestamps: true,
        tableName: "articles",
      }
    );



  Article.associate =
    (models) => {

      Article.belongsTo(
        models.User,
        {
          foreignKey:
            "authorId",

          as:
            "author",
        }
      );
    };



  return Article;
};