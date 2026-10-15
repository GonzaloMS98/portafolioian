import {defineField, defineType} from 'sanity'

export const workSection = defineType({
  name: 'workSection',
  title: 'Work section',
  type: 'document',
  fields: [
    defineField({name: 'label', title: 'Label', type: 'string', validation: (rule) => rule.required()}),
    defineField({name: 'slug', title: 'Slug', type: 'slug', options: {source: 'label'}, validation: (rule) => rule.required()}),
    defineField({name: 'intro', title: 'Introduction', type: 'text', rows: 3}),
    defineField({name: 'order', title: 'Order', type: 'number', initialValue: 0, validation: (rule) => rule.integer().min(0)}),
  ],
  orderings: [{title: 'Manual order', name: 'manualOrder', by: [{field: 'order', direction: 'asc'}]}],
  preview: {select: {title: 'label', subtitle: 'slug.current'}},
})
