'use strict';

module.exports = (_, model, state) =>

_.div({class: 'resource-editor resource-editor--json-editor'},
    state.name === 'error' ? [
        _.div({class: 'widget widget--message centered warn'},
            state.message
        )
    
    ] : [
        _.include(require('./inc/header')),
        _.text({code: true, value: JSON.stringify(model, null, 4), class: 'resource-editor__body', name: 'body', oninput: _.onChangeJson}),
        _.div({class: 'resource-editor__footer'},
            _.include(require('./inc/warning')),
            _.div({class: 'resource-editor__footer__actions'},
                _.a({href: `#/${state.category}/${state.id}`, class: 'widget widget--button embedded'}, 'Basic'),
                _.if(!model.isLocked,
                    _.button({class: 'widget widget--button', name: 'save', onclick: _.onClickSave}, 'Save')
                )
            )
        )
    
    ]
)
