import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { Tree, TreeNodeDropEvent } from 'primeng/tree';
import { Button } from 'primeng/button';
import { PrimeTemplate, TreeDragDropService, TreeNode } from 'primeng/api';
import { Topic } from '../../models/topic.model';
import { TopicService } from '../../services/topic.service';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { Tooltip } from 'primeng/tooltip';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    Tree,
    Button,
    PrimeTemplate,
    NgClass,
    Tooltip
  ],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  host: {
    class: 'flex flex-col border-r-4 bg-surface-0'
  },
  providers: [TreeDragDropService]
})
export class SidebarComponent implements OnInit {
  private topicService = inject(TopicService);
  private router = inject(Router);
  files = signal<TreeNode[]>([]);
  selectedFile = signal<TreeNode | undefined>(undefined);
  topicCreationLoading: boolean = false;
  @Input() collapsed: boolean = false;
  @Input() hover: boolean = false;

  knowledgebaseDropDownActive: boolean = true;

  ngOnInit() {
    this.topicService.getAllTopics().subscribe(topics => {
      // Refresh leads to a tree collpase, workaround implemented but not the best performance
      this.files.set(topics.map(t => this.mapTopicToTreeNode(t)));
    });

    this.topicService.changeSelectedTopic().subscribe(topic => {
      if (topic != null) {
        const treeNode = this.findTreeNode(topic.uuid);
        if (treeNode != null) {
          this.selectedFile.set(treeNode);
        }
      }
    });
  }

  private mapTopicToTreeNode(topic: Topic): TreeNode<Topic> {
    const prevTreeNode = this.findTreeNode(topic.uuid);

    return {
      key: topic.uuid,
      label: topic.title,
      data: topic,
      children: topic.children?.map(child => this.mapTopicToTreeNode(child)) || [],
      expanded: prevTreeNode?.expanded,
      expandedIcon: !topic.children || topic.children.length === 0 ? '' : 'pi pi-folder-open',
      type: 'url',
      collapsedIcon: !topic.children || topic.children.length === 0 ? 'pi pi-file' : 'pi pi-folder',
      leaf: !topic.children || topic.children.length === 0
    };
  }

  private findTreeNode(key: string): TreeNode<Topic> | null {
    const findNodeInTree = (topicsList: TreeNode[]): TreeNode<Topic> | null => {
      for (const topic of topicsList) {
        if (topic.key === key) {
          return topic;
        }

        if (topic.children && topic.children.length > 0) {
          const foundTopic = findNodeInTree(topic.children);
          if (foundTopic !== null) {
            return foundTopic;
          }
        }
      }
      return null;
    };

    return findNodeInTree(this.files());
  }

  viewTopic() {
    const selectedFile = this.selectedFile();
    if (selectedFile?.key) {
      this.router.navigate(['domain/topic/', selectedFile.key]);
    }
  }

  createTopic(treeNode?: TreeNode<Topic>) {
    if (treeNode == null) {
      this.topicCreationLoading = true;
    } else {
      treeNode.loading = true;
    }
    this.topicService.createTopic(treeNode?.key ?? '').subscribe(topic => {
      if (treeNode == null) {
        this.topicCreationLoading = false;
      } else {
        treeNode.loading = false;
      }

      this.router.navigate(['domain/topic/edit', topic.uuid], { queryParams: { new: true } });
    });
  }

  onNodeDrop(e: TreeNodeDropEvent) {
    // update drag.parent_id to drop.id

    const draggedTopic = e.dragNode?.data as Topic;
    const droppedTopic = e.dropNode?.data as Topic;

    if (!draggedTopic || !droppedTopic) return;

    // @ts-ignore workaround https://github.com/primefaces/primeng/issues/15258 should be fixed in next primeng update
    if (e.originalEvent.currentTarget.classList.value.includes('p-tree-node-droppoint')) {
      draggedTopic.parent_uuid = droppedTopic.parent_uuid || undefined;
    } else {
      draggedTopic.parent_uuid = droppedTopic.uuid || undefined;
    }

    this.topicService.updateTopic(draggedTopic).subscribe(() => 1);
  }
}
