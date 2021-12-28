# Let's Setup Prismic

## 1. Custom Type Setup
First, we have to setup the Prismic custom post type.
Follow the official guide from prismic here.

#### Custom Post Type Reference
Name: **Homepage**

API ID: `homepage`

Type: **Single**

## 2. Add Field To Custom Type
For the sake of simplicity, we will only create one `title` field for the `homepage` post type.	

This is the *Homepage field template in JSON format* **or** copy it from `homepage.json`.
```json
{
	"Main" : {
		"title" : {
		"type" : "StructuredText",
		"config" : {
			"single" : "heading1,heading2,heading3,heading4,heading5,heading6",
			"label" : "Title"
			}
		}
	}
}
```

There are 2 ways to do this:
1. Copy the `Homepage field template` above and paste it to the custom type JSON editor. [Follow this guide](https://prismic.io/docs/core-concepts/content-modeling-with-json)
2. **OR**, Do it manually using the Prismic drag-and-drop interface.
![Add title field in Homepage custom type](/assets/images/homepage-field.png "Homepage Field Setting")

## 3. Fill The Field
Super obvious step.
We need to fill the field with something so it will show something when we connect Prismic with Astro.

## 4. Get Prismic API and Setup
1. Get your Prismic API 👇
![Location of Prismic API](/assets/images/prismic-api-screen.png "Prismic API")

2. Copy and store the API key in the `.env` file following the sample of `.env.example`.
