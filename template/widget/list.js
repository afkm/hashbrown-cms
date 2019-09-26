'use strict';

module.exports = (_, model, state) =>

_.ul({class: 'widget widget--list'},
    _.each(model.value, (key, value) =>
        _.li({class: 'widget--list__item widget-group', draggable: model.sortable, ondragstart: model.sortable ? _.onDragStart : null, ondragend: model.sortable ? _.onDragEnd : null, ondragover: model.sortable ? _.onDragOver : null},
            _.if(model.sortable,
                _.span({class: 'widget--list__handle fa fa-bars'})
            ),
            _.if(!model.readonly && model.keys,
                _.text({disabled: model.disabled, value: key, onchange: (newKey) => _.onChangeItemKey(key, newKey)}),
            ),
            _.if(model.readonly,
                _.label({class: 'widget widget--label'}, value.label || value)
            ),
            _.if(!model.readonly,
                _.text({disabled: model.disabled, value: value, onchange: (newValue) => _.onChangeItemValue(key, newValue)})
            ),
            _.if(!model.disabled,
                _.button({class: 'widget widget--button default small fa fa-remove', title: `Remove ${model.label || 'item'} "${value}"`, onclick: () =>  _.onClickRemoveItem(key)})
            )
        )
    ),
    _.if(!model.disabled && !model.readonly,
        _.button({class: 'widget--list__add widget widget--button default expanded low', title: `Add ${model.placeholder || 'item'}`, onclick: _.onClickAddItem},
            _.span({class: 'fa fa-plus'}),
            `Add ${model.placeholder || 'item'}`
        )
    )
)
